/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as path from "path";
import * as filenamify from "filenamify";
import { Container } from "typedi";
import { uuid } from "uuidv4";

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";

import ManagedRepository from "../utils/ManagedRepository";
import CookClient, { IParameters } from "../utils/CookClient";

import Job, { IJobImplementation } from "./Job";
import Scene from "./Scene";
import Item from "./Item";
import ItemBin from "./ItemBin";
import Bin from "./Bin";
import BinType from "./BinType";
import Asset from "./Asset";

////////////////////////////////////////////////////////////////////////////////
// ENVIRONMENT VARIABLES

const digiDriveBasePath = process.env["DIGITIZATION_DRIVE_BASEPATH"];

////////////////////////////////////////////////////////////////////////////////

export type MasterMigrationJobStep = "" | "pre" | "web-thumb" | "web-thumb-post" | "web-multi" | "web-multi-post";

const stepText = {
    "pre": "Fetching master model files",
    "web-thumb": "Cooking recipe 'web-thumb'",
    "web-thumb-post": "Fetching cooked files",
    "web-multi": "Cooking recipe 'web-multi'",
    "web-multi-post": "Fetching cooked files",
};

export interface IMasterMigrationJobParams
{
    name: string;
    projectId: number;

    sourceSceneId: number;
    masterModelGeometry: string;
    masterModelTexture: string;
}

@Table
export default class MasterMigrationJob extends Model<MasterMigrationJob> implements IJobImplementation
{
    static readonly typeName: string = "MasterMigrationJob";
    protected static cookPollingInterval = 3000;

    static async createJob(params: IMasterMigrationJobParams)
    {
        return Job.create({
            name: params.name,
            type: "MasterMigrationJob",
            projectId: params.projectId,
        }).then(job => MasterMigrationJob.create({
            ...params,
            jobId: job.id,
            job
        }));
    }

    ////////////////////////////////////////////////////////////////////////////////
    // SCHEMA

    // the base job
    @ForeignKey(() => Job)
    @Column
    jobId: number;

    @BelongsTo(() => Job)
    job: Job;

    @Column({ type: DataType.STRING, defaultValue: "" })
    step: MasterMigrationJobStep;

    // Path to the master model geometry file on the digitization drive
    @Column({ allowNull: false })
    masterModelGeometry: string;

    // Path to the master model texture file on the digitization drive
    @Column({ allowNull: false })
    masterModelTexture: string;

    // the migrated Voyager scene and bin
    @ForeignKey(() => Scene)
    @Column({ allowNull: false })
    sourceSceneId: number;

    @BelongsTo(() => Scene)
    sourceScene: Scene;

    // The new scene bin generated from this job
    @ForeignKey(() => Bin)
    @Column
    targetBinId: number;

    @BelongsTo(() => Bin)
    targetBin: Bin;

    // the Voyager scene generated from this job
    @ForeignKey(() => Scene)
    @Column
    targetSceneId: number;

    @BelongsTo(() => Scene)
    targetScene: Scene;

    // The new processing bin generated from this job
    @ForeignKey(() => Bin)
    @Column
    processingBinId: number;

    @BelongsTo(() => Bin)
    processingBin: Bin;

    // copy of master model geometry asset in processing bin
    @ForeignKey(() => Asset)
    @Column
    geometryAssetId: number;

    @BelongsTo(() => Asset)
    geometryAsset: Asset;

    // copy of master model texture asset in processing bin
    @ForeignKey(() => Asset)
    @Column
    textureAssetId: number;

    @BelongsTo(() => Asset)
    textureAsset: Asset;

    @Column
    cookThumbJobId: string;

    @Column
    cookMultiJobId: string;

    ////////////////////////////////////////////////////////////////////////////////

    protected timerHandle = null;

    async run()
    {
        switch(this.step) {
            case "":
                return this.executePre();
            case "pre":
                return this.executeWebThumb();
        }
    }

    async cancel()
    {
    }

    async delete()
    {
        const cookClient = Container.get(CookClient);

        if (this.cookThumbJobId) {
            await cookClient.deleteJob(this.cookThumbJobId).catch(() => {});
        }
        if (this.cookMultiJobId) {
            await cookClient.deleteJob(this.cookMultiJobId).catch(() => {});
        }

        return this.destroy();
    }

    protected async executePre()
    {
        this.setStep("pre");

        const repo = Container.get(ManagedRepository);

        if (!this.sourceScene) {
            this.sourceScene = await Scene.findSceneById(this.sourceSceneId);
        }

        // Validate paths to master model files

        let geoFilePath = this.masterModelGeometry;
        let texFilePath = this.masterModelTexture;


        if (!geoFilePath || !geoFilePath.startsWith("Y:\\01_Projects\\")) {
            throw new Error("invalid geometry file path");
        }
        if (texFilePath && !texFilePath.startsWith("Y:\\01_Projects\\")) {
            throw new Error("invalid texture file path");
        }
        if (!digiDriveBasePath) {
            throw new Error("missing digitization drive path");
        }

        geoFilePath = geoFilePath.replace("Y:\\", "").replace(/\\/gi, "/");
        geoFilePath = path.resolve(digiDriveBasePath, geoFilePath);

        if (texFilePath) {
            texFilePath = texFilePath.replace("Y:\\", "").replace(/\\/gi, "/");
            texFilePath = path.resolve(digiDriveBasePath, texFilePath);
        }

        // Create scene bin and processing bin

        const sourceBin = await Bin.findByPk(this.sourceScene.binId, { include: [ Asset, BinType ]});
        const item = await Item.findOne({ include: [ { model: ItemBin, where: { binId: sourceBin.id } } ]});
        const itemName = filenamify(item.name, { replacement: "-" }).replace(/\s/gi, "-").toLowerCase();

        this.processingBin = await Bin.createItemBin(item, {
            name: `${item.name} - Master Model - Processed Files`,
            typeId: BinType.presets.processing,
        });

        this.processingBinId = this.processingBin.id;

        this.targetBin = await Bin.createItemBin(item, {
            name: `${item.name} - Master Model - Voyager Scene`,
            typeId: BinType.presets.voyagerScene,
        });

        this.targetBinId = this.targetBin.id;

        await this.save();

        // Copy master model files from digitization drive to processing bin

        let proms = [];

        const extension = geoFilePath.split(".").pop().toLowerCase();
        proms.push(repo.writeFile(geoFilePath, `${itemName}-master-geometry.${extension}`, this.processingBinId)
        .then(asset => {
            this.geometryAsset = asset;
            this.geometryAssetId = asset.id;
        }));

        if (texFilePath) {
            const extension = texFilePath.split(".").pop().toLowerCase();
            proms.push(repo.writeFile(texFilePath, `${itemName}-master-texture.${extension}`, this.processingBinId)
            .then(asset => {
                this.textureAsset = asset;
                this.textureAssetId = asset.id;
            }));
        }

        await Promise.all(proms);
        await this.save();

        // Copy Voyager scene from source to target bin

        proms = [];
        let sceneAsset: Asset = null;

        sourceBin.assets.forEach(asset => {
            asset.bin = sourceBin;

            if (asset.path === "articles") {
                proms.push(repo.copyAsset(asset, asset.filePath, this.targetBin));
            }

            if (asset.name.endsWith(".svx.json")) {
                sceneAsset = asset;
            }
        });

        await Promise.all(proms);

        if (!sceneAsset) {
            throw new Error("could not find scene.svx.json in source bin");
        }

        if (this.job.state === "cancelled") {
            return;
        }

        return this.executeWebThumb();
    }

    protected async executeWebThumb()
    {
        this.setStep("web-thumb");

        const cookClient = Container.get(CookClient);
        const repo = Container.get(ManagedRepository);

        this.cookThumbJobId = uuid();
        await this.save();

        const documentAsset = await this.sourceScene.$get("voyagerDocument", {include: [ Bin ]}) as Asset;
        const item = await Item.findOne({ include: [ { model: ItemBin, where: { binId: documentAsset.binId } } ]});
        const itemName = filenamify(item.name, { replacement: "-" }).replace(/\s/gi, "-").toLowerCase();

        const thumbJobParams: IParameters = {
            highPolyMeshFile: this.geometryAsset.name,
            documentFile: documentAsset.name,
            baseName: itemName,
        };

        const cookSourceFiles = [
            repo.getFilePath(documentAsset.getStoragePath()),
            repo.getFilePath(this.geometryAsset.getStoragePath()),
        ];

        if (this.textureAsset) {
            thumbJobParams.highPolyDiffuseMapFile = this.textureAsset.name;
            cookSourceFiles.push(repo.getFilePath(this.textureAsset.getStoragePath()));
        }

        await cookClient.createJob(this.cookThumbJobId, "web-thumb", thumbJobParams);
        await cookClient.uploadFiles(this.cookThumbJobId, cookSourceFiles);
        await cookClient.runJob(this.cookThumbJobId);

        this.timerHandle = setInterval(() => {
            this.monitorWebThumb()
            .catch(error => {
                console.log("[MasterMigrationJob] - ERROR while processing 'web-thumb' recipe");
                console.log(error);
                return this.job.setState("error", error.message);
            });
        }, MasterMigrationJob.cookPollingInterval);
    }

    protected async monitorWebThumb()
    {
        const job = this.job;
        console.log(`[PlayMigrationJob] - monitoring job ${job.id} (${job.state}, ${job.step}): ${job.name}`);

        const cookClient = Container.get(CookClient);

        if (job.state === "cancelled") {
            clearInterval(this.timerHandle);
            return cookClient.cancelJob(this.cookThumbJobId);
        }

        const jobInfo = await cookClient.jobInfo(this.cookThumbJobId);

        if (jobInfo && jobInfo.state === "done") {
            clearInterval(this.timerHandle);
            this.executeWebThumbPost();
        }
        else if (!jobInfo || jobInfo.state !== "running") {
            clearInterval(this.timerHandle);
            const message = jobInfo ? jobInfo.error || "Cook job not running" : "Cook job not found";
            throw new Error(message);
        }
    }

    protected async executeWebThumbPost()
    {
        this.setStep("web-thumb-post");

        const cookClient = Container.get(CookClient);
        const repo = Container.get(ManagedRepository);

        const report = await cookClient.jobReport(this.cookThumbJobId);
        const deliveryStep = report.steps["delivery"];
        if (!deliveryStep) {
            throw new Error("job has no delivery step");
        }

        const fileMap = deliveryStep.result["files"];
        if (!fileMap) {
            throw new Error("job delivery contains no files");
        }

        // download result files from web-thumb job to target bin
        await Promise.all(Object.keys(fileMap).map(async fileKey => {

            const filePath = fileMap[fileKey];
            const binId = fileKey.startsWith("scene_") ? this.targetBinId : this.processingBinId;

            const { asset, stream } = await repo.createWriteStream(filePath, binId, true);
            const proms = [ cookClient.downloadFile(this.cookThumbJobId, filePath, stream) ];

            if (fileKey === "scene_document") {
                proms.push(
                    Scene.create({
                        name: this.sourceScene.name,
                        binId: this.targetBinId,
                        voyagerDocumentId: asset.id
                    }).then(scene => {
                        this.targetScene = scene;
                        this.targetSceneId = scene.id;
                        return this.save();
                    })
                );
            }

            return Promise.all(proms);
        }));

        if (!this.targetScene) {
            throw new Error("web-thumb job did not return a scene document");
        }

        this.executeWebMulti();
    }

    protected async executeWebMulti()
    {
        this.setStep("web-multi");

        const cookClient = Container.get(CookClient);
        const repo = Container.get(ManagedRepository);

        this.cookMultiJobId = uuid();
        await this.save();

        const documentAsset = await this.targetScene.$get("voyagerDocument", { include: [ Bin ]}) as Asset;
        const item = await Item.findOne({ include: [ { model: ItemBin, where: { binId: documentAsset.binId } } ]});
        const itemName = filenamify(item.name, { replacement: "-" }).replace(/\s/gi, "-").toLowerCase();

        const multiJobParams: IParameters = {
            highPolyMeshFile: this.geometryAsset.name,
            documentFile: documentAsset.name,
            baseName: itemName,
        };

        const cookSourceFiles = [
            repo.getFilePath(documentAsset.getStoragePath()),
            repo.getFilePath(this.geometryAsset.getStoragePath()),
        ];

        if (this.textureAsset) {
            multiJobParams.highPolyDiffuseMapFile = this.textureAsset.name;
            cookSourceFiles.push(repo.getFilePath(this.textureAsset.getStoragePath()));
        }

        await cookClient.createJob(this.cookMultiJobId, "web-multi", multiJobParams);
        await cookClient.uploadFiles(this.cookMultiJobId, cookSourceFiles);
        await cookClient.runJob(this.cookMultiJobId);

        this.job.setStep("Cooking web-multi recipe");

        // start monitoring timer again
        this.timerHandle = setInterval(() => {
            this.monitorWebMulti()
            .catch(error => {
                console.log("[MasterMigrationJob] - ERROR while processing 'web-multi' recipe");
                console.log(error);
                return this.job.setState("error", error.message);
            });
        }, MasterMigrationJob.cookPollingInterval);

    }

    protected async monitorWebMulti()
    {
        const job = this.job;
        console.log(`[PlayMigrationJob] - monitoring job ${job.id} (${job.state}, ${job.step}): ${job.name}`);

        const cookClient = Container.get(CookClient);

        if (job.state === "cancelled") {
            clearInterval(this.timerHandle);
            return cookClient.cancelJob(this.cookMultiJobId);
        }

        const jobInfo = await cookClient.jobInfo(this.cookMultiJobId);

        if (jobInfo && jobInfo.state === "done") {
            clearInterval(this.timerHandle);
            this.executeWebMultiPost();
        }
        else if (!jobInfo || jobInfo.state !== "running") {
            clearInterval(this.timerHandle);
            const message = jobInfo ? jobInfo.error || "Cook job not running" : "Cook job not found";
            throw new Error(message);
        }
    }

    protected async executeWebMultiPost()
    {
        this.setStep("web-multi-post");

        const cookClient = Container.get(CookClient);
        const repo = Container.get(ManagedRepository);

        const report = await cookClient.jobReport(this.cookMultiJobId);
        const deliveryStep = report.steps["delivery"];
        if (!deliveryStep) {
            throw new Error("job has no delivery step");
        }

        const fileMap = deliveryStep.result["files"];
        if (!fileMap) {
            throw new Error("job delivery contains no files");
        }

        // download result files from web-multi job to target bin
        await Promise.all(Object.keys(fileMap).map(async fileKey => {

            const filePath = fileMap[fileKey];
            const binId = fileKey.startsWith("scene_") ? this.targetBinId : this.processingBinId;

            const { asset, stream } = await repo.createWriteStream(filePath, binId, true);
            const proms = [ cookClient.downloadFile(this.cookMultiJobId, filePath, stream) ];
            return Promise.all(proms);
        }));

        this.processingBinId = null;
        this.targetBinId = null;
        this.geometryAssetId = null;
        this.textureAssetId = null;

        await this.setStep("");
        await this.job.setState("done");
    }

    async setStep(step: MasterMigrationJobStep)
    {
        this.step = step;
        this.job.step = stepText[step] || "";
        return this.saveAll();
    }

    async saveAll()
    {
        return Promise.all([ this.save(), this.job.save() ]);
    }
}