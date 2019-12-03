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

import { Container } from "typedi";
import { uuid } from "uuidv4";

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";

import CookClient, { IParameters } from "../utils/CookClient";
import EDANClient, { IEdanQueryResult } from "../utils/EDANClient";
import ManagedRepository from "../utils/ManagedRepository";

import Bin from "./Bin";
import BinType from "./BinType";
import Item from "./Item";
import ItemBin from "./ItemBin";
import Subject from "./Subject";
import Scene from "./Scene";
import Job, { IJobImplementation } from "./Job";

import MasterMigrationJob from "./MasterMigrationJob";

////////////////////////////////////////////////////////////////////////////////

export interface IPlayMigrationJobParams
{
    name: string;
    projectId: number;

    object: string;
    playboxId: string;
    edanRecordId: string;
    //unitRecordId: string;
    masterModelGeometry: string;
    masterModelTexture: string;
    annotationStyle: string;
    migrateAnnotationColor: boolean;
    createReadingSteps: boolean;
    sheetEntryId: string;
}

@Table
export default class PlayMigrationJob extends Model<PlayMigrationJob> implements IJobImplementation
{
    static readonly typeName: string = "PlayMigrationJob";
    protected static cookPollingInterval = 3000;

    static async createJob(params: IPlayMigrationJobParams)
    {
        return Job.create({
            name: params.name,
            type: "PlayMigrationJob",
            projectId: params.projectId,
        }).then(job => PlayMigrationJob.create({
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

    // the item generated from this job
    @ForeignKey(() => Item)
    @Column
    itemId: number;

    @BelongsTo(() => Item)
    item: Item;

    // the Voyager scene generated from this job
    @ForeignKey(() => Scene)
    sceneId: number;

    @BelongsTo(() => Scene)
    scene: Scene;

    @Column({ type: DataType.UUID })
    cookJobId: string;

    @Column({ allowNull: false })
    object: string;

    @Column({ allowNull: false })
    playboxId: string;

    @Column
    edanRecordId: string;

    @Column
    unitRecordId: string;

    @Column
    masterModelGeometry: string;

    @Column
    masterModelTexture: string;

    @Column({ defaultValue: "Circle" }) // Standard, Extended, Circle
    annotationStyle: string;

    @Column({ defaultValue: false })
    migrateAnnotationColor: boolean;

    @Column({ defaultValue: false })
    createReadingSteps: boolean;

    ////////////////////////////////////////////////////////////////////////////////

    protected timerHandle = null;

    async run()
    {
        const job = this.job;

        const cookClient = Container.get(CookClient);
        const edanClient = Container.get(EDANClient);

        // fetch EDAN MDM record and create new subject and item
        await job.setStep("Fetching EDAN Record");

        const edanRecord = await edanClient.fetchMdmRecord(this.edanRecordId).catch(() => ({} as IEdanQueryResult));
        const edanEntry = edanRecord && edanRecord.rows ? edanRecord.rows[0] : null;
        const name = edanEntry ? edanEntry.title : this.object;
        const description = `Play Scene Migration: Box ID #${this.playboxId}`;

        const subjectParams: any = {
            name,
            description,
            unitRecordId: this.unitRecordId,
        };

        if (edanEntry) {
            subjectParams.edanRecordId = edanEntry.url;
            subjectParams.edanRecordCache = edanEntry;
            subjectParams.unitCode = edanEntry.unitCode;
        }

        await job.setStep("Creating Subject/Item");

        const subject = await Subject.findByNameOrCreate(subjectParams);
        const item = await Item.findByNameAndSubjectOrCreate({
            name: this.object,
            subjectId: subject.id,
        });

        this.item = item;
        this.itemId = item.id;
        this.cookJobId = uuid();
        await this.save();

        // create and run cook job using "migrate-play" recipe
        await job.setStep("Running Migration Recipe");

        const cookJobParams: IParameters = {
            boxId: parseInt(this.playboxId),
            annotationStyle: this.annotationStyle,
            migrateAnnotationColor: !!this.migrateAnnotationColor,
            createReadingSteps: !!this.createReadingSteps,
        };

        if (edanEntry) {
            cookJobParams.edanEntry = JSON.stringify(edanEntry);
        }

        await cookClient.createJob(this.cookJobId, "migrate-play", cookJobParams);
        await cookClient.runJob(this.cookJobId);

        this.timerHandle = setInterval(() => {
            this.monitor()
                .catch(error => {
                    console.log("[PlayMigrationJob] - ERROR");
                    console.log(error);
                    return job.setState("error", error.message);
                });
        }, PlayMigrationJob.cookPollingInterval);
    }

    async cancel()
    {
        const cookClient = Container.get(CookClient);

        const job = this.job;

        if (job.step === "Running Migration Recipe") {
            await cookClient.cancelJob(this.cookJobId);
        }

        job.setStep("");
    }

    async delete()
    {
        const cookClient = Container.get(CookClient);

        const job = this.job;

        // can't delete during fetch
        if (job.step === "Fetching Assets") {
            throw new Error("can't delete while fetching assets");
        }

        return cookClient.deleteJob(this.cookJobId)
            .catch(() => {})
            .finally(() => this.destroy());
    }

    protected async monitor()
    {
        const job = this.job;
        console.log(`[PlayMigrationJob] - monitoring job ${job.id} (${job.state}): ${job.name}`);

        if (job.step !== "Running Migration Recipe") {
            return;
        }

        const cookClient = Container.get(CookClient);

        const jobInfo = await cookClient.jobInfo(this.cookJobId);

        if (jobInfo && jobInfo.state === "done") {
            clearInterval(this.timerHandle);
            await this.postProcessingStep(job);
        }
        else if (!jobInfo || jobInfo.state !== "running") {
            clearInterval(this.timerHandle);
            const message = jobInfo ? jobInfo.error || "Cook job not running" : "Cook job not found";
            throw new Error(message);
        }
    }

    protected async postProcessingStep(job: Job)
    {
        await job.setStep("Fetching Assets");

        const cookClient = Container.get(CookClient);
        const repo = Container.get(ManagedRepository);

        let name, scene;

        const report = await cookClient.jobReport(this.cookJobId);

        const edanJson = report.parameters.edanEntry as string;
        const edanEntry = edanJson ? JSON.parse(edanJson) : null;
        name = this.object || edanEntry.title;

        const item = this.item;

        const [ sceneItemBin, tempItemBin, boxItemBin ] = await Promise.all([
            Bin.create({
                name: `${item.name} - Play Migration - Voyager Scene`,
                typeId: BinType.presets.voyagerScene,
            }).then(bin => ItemBin.create({
                binId: bin.id,
                itemId: item.id,
            })),
            Bin.create({
                name: `${item.name} - Play Migration - Processed Files`,
                typeId: BinType.presets.processing,
            }).then(bin => ItemBin.create({
                binId: bin.id,
                itemId: item.id,
            })),
            Bin.create({
                name: `${item.name} - Play Migration - Playbox Assets`,
                typeId: BinType.presets.processing,
            }).then(bin => ItemBin.create({
                binId: bin.id,
                itemId: item.id,
            })),
        ]);

        const deliveryStep = report.steps["delivery"];
        if (!deliveryStep) {
            throw new Error("job has no delivery step");
        }

        const fileMap = deliveryStep.result["files"];
        if (!fileMap) {
            throw new Error("job delivery contains no files");
        }

        await Promise.all(Object.keys(fileMap).map(fileKey => {

            const binId = fileKey.startsWith("box_") ? boxItemBin.binId :
                (fileKey.startsWith("temp_") ? tempItemBin.binId : sceneItemBin.binId);

            const filePath = fileMap[fileKey];

            return repo.createWriteStream(filePath, binId, true)
            .then(({ stream, asset }) => {
                const proms = [ cookClient.downloadFile(this.cookJobId, filePath, stream) ];

                if (fileKey === "scene_document") {
                    proms.push(
                        Scene.create({
                            name,
                            binId: sceneItemBin.binId,
                            voyagerDocumentId: asset.id
                        }).then(_scene => {
                            scene = _scene;
                            this.scene = scene;
                            this.sceneId = scene.id;
                            return this.save();
                        })
                    );
                }

                return Promise.all(proms);
            });
        }));

        // if scene has been created successfully and migration entry has a master geometry,
        // create a successor job for processing the master model
        if (scene && this.masterModelGeometry) {
            await MasterMigrationJob.createJob({
                name: `Master Model Migration: #${this.playboxId} - ${this.object}`,
                projectId: this.job.projectId,
                sourceSceneId: scene.id,
                masterModelGeometry: this.masterModelGeometry,
                masterModelTexture: this.masterModelTexture,
            });
        }

        job.step = "";
        job.state = "done";
        await this.saveAll();
    }

    async saveAll()
    {
        return Promise.all([ this.save(), this.job.save() ]);
    }
}