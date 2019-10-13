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

import Asset from "./Asset";
import Bin from "./Bin";
import Item from "./Item";
import ItemBin from "./ItemBin";
import Subject from "./Subject";
import Scene from "./Scene";

import Job, { IJobImplementation } from "./Job";

import CookClient, { IParameters } from "../utils/CookClient";
import { IJobReport } from "../utils/cookTypes";
import EDANClient, { IEdanEntry, IEdanQueryResult } from "../utils/EDANClient";
import BinType from "./BinType";
import ManagedRepository from "../utils/ManagedRepository";

////////////////////////////////////////////////////////////////////////////////

export type MigrationJobStep = "process" | "fetch" | "";

@Table
export default class PlayMigrationJob extends Model<PlayMigrationJob> implements IJobImplementation
{
    static readonly typeName: string = "PlayMigrationJob";
    protected static cookPollingInterval = 3000;

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
    sharedDriveFolder: string;

    @Column
    masterModelGeometry: string;

    @Column
    masterModelTexture: string;

    @Column({ defaultValue: "Circle" }) // Standard, Extended, Circle
    annotationStyle: string;

    @Column({ defaultValue: false })
    migrateAnnotationColor: boolean;

    ////////////////////////////////////////////////////////////////////////////////

    protected timerHandle = null;

    async run(job: Job)
    {
        if (this.jobId !== job.id) {
            throw new Error(`job id mismatch: Job ${job.id } !== ${this.jobId}`);
        }

        const cookClient = Container.get(CookClient);

        this.job = job;
        this.step = "process";

        return this.save()
        .then(() => {
            const params: IParameters = {
                boxId: parseInt(this.playboxId),
                annotationStyle: this.annotationStyle,
                migrateAnnotationColor: !!this.migrateAnnotationColor,
            };

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

        if (this.step === "process") {
            return cookClient.deleteJob(this.cookJobId)
                .finally(() => this.destroy());
        }
        else if (this.step === "fetch") {
            // can't delete during fetch
            return Promise.reject(new Error("can't delete while fetching assets"));
        }

        return this.destroy();
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
        const edanClient = Container.get(EDANClient);
        const repo = Container.get(ManagedRepository);

        let report: IJobReport = undefined;
        let record: IEdanQueryResult = undefined;
        let entry: IEdanEntry = undefined;

        let name, description;

        return cookClient.jobReport(this.cookJobId)
            .then(_report => {
                report = _report;

                return edanClient.fetchMdmRecord(this.edanRecordId)
                    .then(_record => record = _record)
                    .catch(() => {});
            })
            .then(() => {
                entry = record && record.rows ? record.rows[0] : null;

                name = entry ? entry.title : this.object;
                description = `Play Scene Migration: Box ID #${this.playboxId}`;

                const subject: any = {
                    name,
                    description,
                    unitRecordId: this.unitRecordId,
                };
                if (record) {
                    subject.edanRecordId = entry.url;
                    subject.edanRecordCache = entry;
                    subject.unitCode = entry.unitCode;
                }

                return Subject.findByNameOrCreate(subject);
            })
            .then(subject =>
                Item.findByNameAndSubjectOrCreate({
                    name: this.object,
                    subjectId: subject.id,
                })
            )
            .then(item =>
                Promise.all([
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
                ])
            )
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
                                    })
                                );
                            }

                            return Promise.all(proms);
                        });
                }));
            })
            .then(() => {
                this.step = "";
                job.state = "done";

                return Promise.all([ this.save(), job.save() ]);
            });
    }
}