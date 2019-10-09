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

import CookJob from "./CookJob";
import CookClient from "../utils/CookClient";

////////////////////////////////////////////////////////////////////////////////

// TODO: Centralize
const cookClient = new CookClient(
    process.env["COOK_MACHINE_ADDRESS"],
    process.env["COOK_CLIENT_ID"],
);

export type MigrationJobStep = "process" | "fetch" | "";

@Table
export default class PlayMigrationJob extends Model<PlayMigrationJob>
{
    static readonly typeName: string = "PlayMigrationJob";

    ////////////////////////////////////////////////////////////////////////////////
    // SCHEMA

    @ForeignKey(() => Job)
    @Column
    jobId: number;

    @BelongsTo(() => Job)
    job: Job;

    @Column({ defaultValue: "" })
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

    @ForeignKey(() => Item)
    @Column
    itemId: number;

    @BelongsTo(() => Item)
    item: Item;

    ////////////////////////////////////////////////////////////////////////////////

    async runJob()
    {
        this.job.state = "running";
        this.step = "process";
        await Promise.all([ this.save, this.job.save ]);

        const cookJob = await CookJob.createJob(cookClient, {
            name: this.job.name,
            recipeId: "migrate-play",
            parameters: {
                boxId: parseInt(this.playboxId),
                annotationStyle: this.annotationStyle,
                migrateAnnotationColor: !!this.migrateAnnotationColor,
            },
        });

        if (cookJob.state === "error") {
            this.job.state = "error";
            this.job.error = cookJob.error;
            this.step = "";
            return Promise.all([ this.save(), this.job.save(), cookJob.destroy() ]);
        }

        return cookJob.runJob(cookClient).then(() => {
            if (cookJob.state === "error") {
                this.job.state = "error";
                this.job.error = cookJob.error;
                this.step = "";

                return Promise.all([ this.save(), this.job.save(), cookJob.destroy() ]) as Promise<unknown>;
            }

            this.job.state = "running";
            this.cookJobId = cookJob.id;
            this.step = "process";
            return Promise.all([ this.save(), this.job.save() ]) as Promise<unknown>;
        });
    }

    async updateJob()
    {
        const state = this.job.state;

        if (state !== "running") {
            return Promise.resolve();
        }

        if (this.step === "process") {
            const cookJob = await CookJob.findByPk(this.cookJobId);
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