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

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";

import CookClient, { IParameters } from "../utils/CookClient";
import { IJobReport } from "../utils/cookTypes";
import EDANClient, { IEdanEntry, IEdanQueryResult } from "../utils/EDANClient";
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

export type MigrationJobStep = "process" | "fetch" | "";

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

    @Column({ type: DataType.STRING, defaultValue: "" })
    step: MigrationJobStep;

    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4 })
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

    async run(job: Job)
    {
        if (this.jobId !== job.id) {
            throw new Error(`job id mismatch: Job ${job.id } !== ${this.jobId}`);
        }

        const cookClient = Container.get(CookClient);
        const edanClient = Container.get(EDANClient);

        this.job = job;
        this.step = "process";

        let edanRecord: IEdanQueryResult;
        let edanEntry: IEdanEntry;
        let name, description;

        return this.save()
        .then(() => edanClient.fetchMdmRecord(this.edanRecordId)
            .then(_record => edanRecord = _record).catch(() => {})
        )
        .then(() => {
            edanEntry = edanRecord && edanRecord.rows ? edanRecord.rows[0] : null;
            name = edanEntry ? edanEntry.title : this.object;
            description = `Play Scene Migration: Box ID #${this.playboxId}`;

            const subject: any = {
                name,
                description,
                unitRecordId: this.unitRecordId,
            };
            if (edanEntry) {
                subject.edanRecordId = edanEntry.url;
                subject.edanRecordCache = edanEntry;
                subject.unitCode = edanEntry.unitCode;
            }

            return Subject.findByNameOrCreate(subject);
        })
        .then(subject =>
            Item.findByNameAndSubjectOrCreate({
                name: this.object,
                subjectId: subject.id,
            })
        )
        .then(item => {
            this.item = item;
            this.itemId = item.id;
            return this.save();
        })
        .then(() => {
            const params: IParameters = {
                boxId: parseInt(this.playboxId),
                annotationStyle: this.annotationStyle,
                migrateAnnotationColor: !!this.migrateAnnotationColor,
                createReadingSteps: !!this.createReadingSteps,
            };

            if (edanEntry) {
                params.edanEntry = JSON.stringify(edanEntry);
            }

            return cookClient.createJob(this.cookJobId, "migrate-play", params);
        })
        .then(() => cookClient.runJob(this.cookJobId))
        .then(() => {
            this.timerHandle = setInterval(() => this.monitor(job), PlayMigrationJob.cookPollingInterval);
        })
        .catch(err => {
            this.step = "";
            return this.save().then(() => { throw err; });
        });
    }

    async cancel()
    {
        const cookClient = Container.get(CookClient);

        const step = this.step;
        this.step = "";

        return this.save()
        .then(() => {
            if (step === "process") {
                return cookClient.cancelJob(this.cookJobId);
            }
        });
    }

    async delete()
    {
        const cookClient = Container.get(CookClient);

        // can't delete during fetch
        if (this.step === "fetch") {
            return Promise.reject(new Error("can't delete while fetching assets"));
        }

        return cookClient.deleteJob(this.cookJobId).catch(() => {})
            .finally(() => this.destroy());
    }

    protected async monitor(job: Job)
    {
        console.log(`[PlayMigrationJob] - monitoring job ${job.id} (${job.state}): ${job.name}`);

        if (this.step !== "process") {
            return;
        }

        const cookClient = Container.get(CookClient);

        return cookClient.jobInfo(this.cookJobId)
        .then(jobInfo => {
            if (jobInfo.state === "done") {
                clearInterval(this.timerHandle);
                this.step = "fetch";
                return this.save()
                    .then(() => this.postProcessingStep(job));
            }
            if (!jobInfo || jobInfo.state !== "running") {
                clearInterval(this.timerHandle);
                const message = jobInfo ? jobInfo.error || "Cook job not running" : "Cook job not found";
                throw new Error(message);
            }

        })
        .catch(error => {
            console.log("[PlayMigrationJob] - ERROR");
            console.log(error);

            this.step = "";
            job.state = "error";
            job.error = error.message;
            return Promise.all([ this.save(), this.job.save() ]);
        });
    }

    protected async postProcessingStep(job: Job)
    {
        const cookClient = Container.get(CookClient);
        const repo = Container.get(ManagedRepository);

        let report: IJobReport = undefined;
        let name, scene;

        return cookClient.jobReport(this.cookJobId)
            .then(_report => {
                report = _report;
                const edanJson = report.parameters.edanEntry as string;
                const edanEntry = edanJson ? JSON.parse(edanJson) : null;
                name = this.object || edanEntry.title;
            })
            .then(() => {
                const item = this.item;
                return Promise.all([
                    Bin.create({
                        name: `Play Migration #${this.playboxId} - Voyager Scene`,
                        typeId: BinType.presets.voyagerScene,
                    }).then(bin => ItemBin.create({
                        binId: bin.id,
                        itemId: item.id,
                    })),
                    Bin.create({
                        name: `Play Migration #${this.playboxId} - Processing Files`,
                        typeId: BinType.presets.processing,
                    }).then(bin => ItemBin.create({
                        binId: bin.id,
                        itemId: item.id,
                    })),
                    Bin.create({
                        name: `Play Migration #${this.playboxId} - Playbox Assets`,
                        typeId: BinType.presets.processing,
                    }).then(bin => ItemBin.create({
                        binId: bin.id,
                        itemId: item.id,
                    })),
                ]);
            })
            .then(([sceneItemBin, tempItemBin, boxItemBin]) => {
                const deliveryStep = report.steps["delivery"];
                if (!deliveryStep) {
                    throw new Error("job has no delivery step");
                }

                const fileMap = deliveryStep.result["files"];
                if (!fileMap) {
                    throw new Error("job delivery contains no files");
                }

                return Promise.all(Object.keys(fileMap).map(fileKey => {

                    const binId = fileKey.startsWith("box:") ? boxItemBin.binId :
                        (fileKey.startsWith("temp:") ? tempItemBin.binId : sceneItemBin.binId);

                    const filePath = fileMap[fileKey];

                    return repo.createWriteStream(filePath, binId, true)
                        .then(({ stream, asset }) => {
                            const proms = [ cookClient.downloadFile(this.cookJobId, filePath, stream) ];

                            if (fileKey === "scene:document") {
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
            })
            .then(() => {
                // if scene has been created successfully and migration entry has a master geometry,
                // create a successor job for processing the master model
                if (scene && this.masterModelGeometry) {
                    return MasterMigrationJob.createJob({
                        name: `Master Model Migration: #${this.playboxId} - ${this.object}`,
                        projectId: this.job.projectId,
                        sourceSceneId: scene.id,
                        masterModelGeometry: this.masterModelGeometry,
                        masterModelTexture: this.masterModelTexture,
                    });
                }
            })
            .then(() => {
                //this.cookJobId = "";
                this.step = "";
                job.state = "done";

                return Promise.all([ this.save(), job.save() ]);
            });
    }
}