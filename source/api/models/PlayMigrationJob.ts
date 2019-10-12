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

import Item from "./Item";
import Job, { IJobImplementation } from "./Job";

import CookTask from "./CookTask";
import CookClient, { IParameters } from "../utils/CookClient";

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

        let client: CookClient = null;

        this.job = job;
        this.step = "process";

        return this.save()
        .then(() => this.getCookClient())
        .then(_client => {
            client = _client;

            const params: IParameters = {
                boxId: parseInt(this.playboxId),
                annotationStyle: this.annotationStyle,
                migrateAnnotationColor: !!this.migrateAnnotationColor,
            };

            return client.createJob(this.cookJobId, "migrate-play", params);
        })
        .then(() => client.runJob(this.cookJobId))
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
        const step = this.step;
        this.step = "";

        return this.save()
        .then(() => {
            if (step === "process") {
                return this.getCookClient()
                    .then(client => client.cancelJob(this.cookJobId));
            }
        });
    }

    async delete()
    {
        if (this.step === "process") {
            return this.getCookClient()
                .then(client => client.deleteJob(this.cookJobId))
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

        return this.getCookClient()
        .then(client => client.jobInfo(this.cookJobId))
        .then(jobInfo => {
            if (jobInfo.state === "done") {
                clearInterval(this.timerHandle);
                return this.postProcessingStep(job);
            }
            if (!jobInfo || jobInfo.state !== "running") {
                const message = jobInfo ? jobInfo.error || "Cook job not running" : "Cook job not found";
                throw new Error(message);
            }

        })
        .catch(error => {
            this.step = "";
            job.state = "error";
            job.error = error.message;
            return Promise.all([ this.save(), this.job.save() ]);
        });
    }

    protected async postProcessingStep(job: Job)
    {
        // fetch files, create assets
        // create item
        // create scene

        job.state = "done";
        return job.save();
    }

    protected async getCookClient()
    {
        const client = Container.get(CookClient);

        return client.machineInfo()
            .then(() => client)
            .catch(error => {
                throw new Error(`Cook service not available: ${error.message}`);
            });
    }
}