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

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";

import Item from "./Item";
import Job from "./Job";

import CookTask from "./CookTask";

import { cookClient }  from "../app/Services";

////////////////////////////////////////////////////////////////////////////////

export type MigrationJobStep = "process" | "fetch" | "";

@Table
export default class PlayMigrationJob extends Model<PlayMigrationJob>
{
    //static readonly typeName: string = "PlayMigrationJob";

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

    @Column
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

    protected async isCookServiceAvailable()
    {
        return cookClient.machineInfo()
            .then(() => true)
            .catch(err => {
                this.job.state = "error";
                this.job.error = `Cook service not available: ${err.message}`;

            });
    }

    async runJob()
    {
        const state = this.job.state;

        if (state !== "created" && state !== "started") {
            throw new Error("can't run job if not created or started");
        }

        // switch state and set step
        this.job.state = "running";
        this.step = "process";

        return Promise.all([ this.save(), this.job.save() ])
            .then(() => cookClient.machineInfo())
            .catch(err => {
                err.message = `Cook service not available: ${err.message}`;
                throw err;
            })
            .then(() => (
                CookTask.createJob(cookClient, {
                    name: this.job.name,
                    recipeId: "migrate-play",
                    parameters: {
                        boxId: parseInt(this.playboxId),
                        annotationStyle: this.annotationStyle,
                        migrateAnnotationColor: !!this.migrateAnnotationColor,
                    },
                })
            )
            .then(cookJob => {
                if (cookJob.state === "error") {
                    throw new Error(`Cook error: ${cookJob.error}`);
                }

                return cookJob.runJob(cookClient).then(() => {
                    if (cookJob.state === "error") {
                        throw new Error(`Cook error: ${cookJob.error}`);
                    }

                    this.cookJobId = cookJob.id;
                    return this.save();
                });
            }))
            .catch(err => {
                this.job.state = "error";
                this.job.error = err.message;
                this.step = "";
                return Promise.all([ this.save(), this.job.save() ]);
            });
    }

    async updateJob()
    {
        const state = this.job.state;

        if (state !== "running" && state !== "waiting") {
            throw new Error("can't update job if not running or waiting");
        }

        if (this.step === "process") {
            const cookJob = await CookTask.findByPk(this.cookJobId);
            if (!cookJob) {
                this.job.state = "error";
                this.job.error = "Database error: cook job not found.";
                this.step = "";
                return Promise.all([ this.save(), this.job.save() ]);
            }

            return cookJob.updateJob(cookClient).then(async () => {

                if (cookJob.state === "error") {
                    this.job.state = "error";
                    this.job.error = cookJob.error;
                    this.step = "";

                    return Promise.all([ this.save(), this.job.save() ]);
                }

                if (cookJob.state === "done") {
                    this.step = "fetch";
                    await this.save();

                    return this.postProcessingStep().then(() => {
                        // all good, entire job is done, update state and delete associated cook job
                        this.job.state = "done";
                        this.step = "";
                        this.cookJobId = null;
                        return Promise.all([ cookJob.deleteJob(cookClient), this.save(), this.job.save() ]);
                    })
                    .catch(err => {
                        // error during result fetching, set error state and keep associated cook job
                        this.job.state = "error";
                        this.job.error = err.message;
                        this.step = "";
                    });

                }

                return Promise.resolve();
            });
        }
    }

    protected async postProcessingStep()
    {
        // fetch files, create assets
        // create item
        // create scene

        return Promise.resolve();
    }
}