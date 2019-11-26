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

import * as fs from "fs";
import * as path from "path";
import { Container } from "typedi";

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";

import Job, { IJobImplementation } from "./Job";
import Scene from "./Scene";
import Item from "./Item";
import ItemBin from "./ItemBin";
import Bin from "./Bin";
import BinType from "./BinType";
import Asset from "./Asset";

import ManagedRepository from "../utils/ManagedRepository";
import CookClient from "../utils/CookClient";

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

    // master model geometry asset
    @ForeignKey(() => Asset)
    @Column
    geometryAssetId: number;

    @BelongsTo(() => Asset)
    geometryAsset: Asset;

    // master model texture asset
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

    async run()
    {
        this.sourceScene = await this.$get("sourceScene") as Scene;

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

        const repo = Container.get(ManagedRepository);

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

        proms = [];

        sourceBin.assets.forEach(asset => {
            if (asset.path === "articles" || asset.name === "scene.svx.json") {
                proms.push(repo.writeFile(asset.getStoragePath(sourceBin), asset.filePath, targetBin.id));
            }
        });

        await Promise.all(proms);

        // 3. create web-thumb job, run
        // 4.
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

    }
}