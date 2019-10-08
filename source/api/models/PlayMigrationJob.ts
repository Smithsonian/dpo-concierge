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

import CookJob from "./CookJob";
import Job from "./Job";
import CookClient from "../utils/CookClient";

////////////////////////////////////////////////////////////////////////////////

// TODO: Centralize
const cookClient = new CookClient(
    process.env["COOK_MACHINE_ADDRESS"],
    process.env["COOK_CLIENT_ID"],
);

@Table
export default class PlayMigrationJob extends Model<PlayMigrationJob>
{
    static readonly typeName: string = "PlayMigrationJob";

    @ForeignKey(() => Job)
    @Column
    jobId: number;

    @BelongsTo(() => Job)
    job: Job;

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

    async runJob()
    {
        const cookJob = await CookJob.createJob(cookClient, {
            name: this.job.name,
            recipeId: "migrate-play",
            parameters: {
                boxId: parseInt(this.playboxId),
                annotationStyle: this.annotationStyle,
                migrateAnnotationColor: !!this.migrateAnnotationColor,
            },
        });

        this.cookJobId = cookJob.id;
        await this.save();

        await cookJob.runJob(cookClient);

        this.job.state = "running";
        return this.job.save();
    }

    async updateJob()
    {
        const state = this.job.state;

        if (state === "running" || state === "waiting") {
            const cookJob = await CookJob.findByPk(this.cookJobId);
            await cookJob.updateJob(cookClient);

            if (cookJob.state !== state) {
                this.job.state = cookJob.state;
                this.job.save();
            }
        }
    }
}