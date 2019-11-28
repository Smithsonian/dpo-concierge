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
import { Container } from "typedi";
import uuidv4 from "uuidv4";

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

    // the migrated Voyager scene and bin
    @ForeignKey(() => Scene)
    @Column
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

    // temporary bin holding a local copy of the master model files
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

    @Column
    masterModelGeometry: string;

    @Column
    masterModelTexture: string;

    ////////////////////////////////////////////////////////////////////////////////

    protected timerHandle = null;

    async run()
    {
        this.sourceScene = await this.$get("sourceScene") as Scene;

        const repo = Container.get(ManagedRepository);
        const cookClient = Container.get(CookClient);

        const job = this.job;
        await job.setStep("Fetching Master Model");

        // Create temporary processing bin

        this.processingBin = await Bin.createJobBin(job, {
            name: `${this.sourceScene.name} - Temp master model data`,
            typeId: BinType.presets.processing,
        });

        this.processingBinId = this.processingBin.id;
        await this.save();

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

        // Copy master model files from digitization drive to processing bin

        let proms = [];

        const extension = geoFilePath.split(".").pop().toLowerCase();
        proms.push(repo.writeFile(geoFilePath, `geometry.${extension}`, this.processingBinId)
            .then(asset => {
                this.geometryAsset = asset;
                this.geometryAssetId = asset.id;
            }));

        if (texFilePath) {
            const extension = texFilePath.split(".").pop().toLowerCase();
            proms.push(repo.writeFile(texFilePath, `texture.${extension}`, this.processingBinId)
                .then(asset => {
                    this.textureAsset = asset;
                    this.textureAssetId = asset.id;
                }));
        }

        await Promise.all(proms);
        await this.save();

        // Copy scene
        await job.setStep("Copying Voyager Scene Bin");

        const sourceBin = await Bin.findOne({ where: { id: this.sourceScene.binId }, include: [ Asset, BinType ]});
        const item = await Item.findOne({ include: [ { model: ItemBin, where: { binId: sourceBin.id } } ]});

        const targetBin = await Bin.createItemBin(item, {
            name: `${sourceBin.name}/Reprocessed`,
            typeId: BinType.presets.voyagerScene,
        });

        this.targetBin = targetBin;
        this.targetBinId = targetBin.id;
        await this.save();

        proms = [];
        let sceneAsset: Asset = null;

        sourceBin.assets.forEach(asset => {
            asset.bin = sourceBin;

            if (asset.path === "articles") {
                proms.push(repo.copyAsset(asset, asset.filePath, targetBin));
            }

            if (asset.name.endsWith(".svx.json")) {
                sceneAsset = asset;
            }
        });

        await Promise.all(proms);

        if (!sceneAsset) {
            throw new Error("could not find scene.svx.json in source bin");
        }

        // Create and run web-thumb job

        this.job.step = "Preparing web-thumb recipe";
        this.cookThumbJobId = uuidv4();
        await this.saveAll();

        const thumbJobParams: IParameters = {
            highPolyMeshFile: this.geometryAsset.name,
            documentFile: sceneAsset.name,
            baseName: "",
        };

        const cookSourceFiles = [
            sceneAsset.getStoragePath(),
            this.geometryAsset.getStoragePath(),
        ];

        if (this.textureAsset) {
            thumbJobParams.highPolyDiffuseMapFile = this.textureAsset.name;
            cookSourceFiles.push(this.textureAsset.getStoragePath());
        }

        await cookClient.createJob(this.cookThumbJobId, "web-thumb", thumbJobParams);
        await cookClient.uploadFiles(this.cookThumbJobId, cookSourceFiles);
        await cookClient.runJob(this.cookThumbJobId);

        this.job.setStep("Cooking web-thumb recipe");

        this.timerHandle = setInterval(() => {
            this.monitor()
            .catch(error => {
                console.log("[MasterMigrationJob] - ERROR");
                console.log(error);
                return job.setState("error", error.message);
            });
        }, MasterMigrationJob.cookPollingInterval);
    }

    async cancel()
    {
        await this.job.setStep("");
    }

    async delete()
    {
        const repo = Container.get(ManagedRepository);
        const cookClient = Container.get(CookClient);

        if (this.cookThumbJobId) {
            await cookClient.deleteJob(this.cookThumbJobId);
        }
        if (this.cookMultiJobId) {
            await cookClient.deleteJob(this.cookMultiJobId);
        }
        if (this.processingBinId) {
            await repo.deleteBinFolder(this.processingBin);
        }

        await this.destroy();
    }

    protected async monitor()
    {
        const job = this.job;
        console.log(`[PlayMigrationJob] - monitoring job ${job.id} (${job.state}, ${job.step}): ${job.name}`);

        const cookClient = Container.get(CookClient);
        const repo = Container.get(ManagedRepository);

        if (this.job.step === "Cooking web-thumb recipe") {
            const jobInfo = await cookClient.jobInfo(this.cookThumbJobId);

            if (jobInfo && jobInfo.state === "done") {
                clearInterval(this.timerHandle);
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
                let sceneAsset = null;
                await Promise.all(Object.keys(fileMap).map(fileKey => {

                    const filePath = fileMap[fileKey];

                    return repo.createWriteStream(filePath, this.targetBinId, true)
                    .then(({ stream, asset }) => {
                        const proms = [ cookClient.downloadFile(this.cookThumbJobId, filePath, stream) ];

                        if (fileKey === "scene:document") {
                            sceneAsset = asset;
                            sceneAsset.bin = this.targetBin;

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
                    });
                }));

                if (!sceneAsset) {
                    throw new Error("web-thumb job did not return a scene document");
                }

                this.job.setStep("Preparing web-multi recipe");
                this.cookMultiJobId = uuidv4();
                await this.save();

                const multiJobParams: IParameters = {
                    highPolyMeshFile: this.geometryAsset.name,
                    documentFile: sceneAsset.name,
                    baseName: "",
                };

                const cookSourceFiles = [
                    sceneAsset.getStoragePath(),
                    this.geometryAsset.getStoragePath(),
                ];

                if (this.textureAsset) {
                    multiJobParams.highPolyDiffuseMapFile = this.textureAsset.name;
                    cookSourceFiles.push(this.textureAsset.getStoragePath());
                }

                await cookClient.createJob(this.cookMultiJobId, "web-multi", multiJobParams);
                await cookClient.uploadFiles(this.cookMultiJobId, cookSourceFiles);
                await cookClient.runJob(this.cookMultiJobId);

                this.job.setStep("Cooking web-multi recipe");

                // start monitoring timer again
                this.timerHandle = setInterval(() => {
                    this.monitor()
                    .catch(error => {
                        console.log("[MasterMigrationJob] - ERROR");
                        console.log(error);
                        return job.setState("error", error.message);
                    });
                }, MasterMigrationJob.cookPollingInterval);
            }
            else if (!jobInfo || jobInfo.state !== "running") {
                clearInterval(this.timerHandle);
                const message = jobInfo ? jobInfo.error || "Cook job not running" : "Cook job not found";
                throw new Error(message);
            }
        }
        else if (this.job.step === "Cooking web-multi recipe") {
            const jobInfo = await cookClient.jobInfo(this.cookMultiJobId);
            if (jobInfo && jobInfo.state === "done") {
                clearInterval(this.timerHandle);
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
                await Promise.all(Object.keys(fileMap).map(fileKey => {

                    const filePath = fileMap[fileKey];

                    return repo.createWriteStream(filePath, this.targetBinId, true)
                    .then(({ stream, asset }) => {
                        const proms = [ cookClient.downloadFile(this.cookThumbJobId, filePath, stream) ];

                        // if (fileKey === "scene:document") {
                        //     sceneAsset = asset;
                        //     sceneAsset.bin = this.targetBin;
                        //
                        //     proms.push(
                        //         Scene.create({
                        //             name: this.sourceScene.name,
                        //             binId: this.targetBinId,
                        //             voyagerDocumentId: asset.id
                        //         }).then(scene => {
                        //             this.targetScene = scene;
                        //             this.targetSceneId = scene.id;
                        //             return this.save();
                        //         })
                        //     );
                        // }

                        return Promise.all(proms);
                    });
                }));

            }
            else if (!jobInfo || jobInfo.state !== "running") {
                clearInterval(this.timerHandle);
                const message = jobInfo ? jobInfo.error || "Cook job not running" : "Cook job not found";
                throw new Error(message);
            }
        }
        else {
            console.error("[MasterMigrationHob] Can't monitor this step");
            throw new Error("can't monitor this step");
        }
    }

    async saveAll()
    {
        return Promise.all([ this.save(), this.job.save() ]);
    }
}