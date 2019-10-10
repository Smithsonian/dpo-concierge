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

import CookClient, { IParameters } from "../utils/CookClient";
import Task from "./Task";

////////////////////////////////////////////////////////////////////////////////

export type JobState = "created" | "waiting" | "running" | "done" | "error" | "cancelled";

export { IParameters };

export interface IJobCreateOptions
{
    name: string;
    recipeId: string;
    parameters: IParameters;
}

@Table
export default class CookTask extends Model<CookTask>
{
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, unique: true })
    jobId: string;

    @ForeignKey(() => Task)
    @Column
    taskId: number;

    @BelongsTo(() => Task)
    task: Task;

    @Column
    name: string;

    @Column
    recipeId: string;

    @Column({ type: DataType.TEXT })
    set parameters(value: IParameters) {
        this.setDataValue("parameters", JSON.stringify(value) as any);
    }
    get parameters(): IParameters {
        return JSON.parse(this.getDataValue("parameters") as any);
    }

    @Column({ defaultValue: "created "})
    state: JobState;

    @Column({ defaultValue: "" })
    step: string;

    @Column({ type: DataType.TEXT })
    set report(value: any) {
        this.setDataValue("report", JSON.stringify(value) as any);
    }
    get report() {
        return JSON.parse(this.getDataValue("report") as any);
    }

    @Column({ type: DataType.TEXT, defaultValue: "" })
    error: string;

    static async createJob(client: CookClient, options: IJobCreateOptions): Promise<CookTask>
    {
        const task = await CookTask.create(options);

        return client.createJob(task.jobId, task.recipeId, task.parameters)
            .then(() => task)
            .catch(err => {
                task.state = "error";
                task.error = "Cook service failed to create job: " + err.message;
                return task.save();
            });
    }

    async runJob(client: CookClient)
    {
        return client.runJob(this.jobId)
            .catch(err => {
                this.state = "error";
                this.error = "Cook service failed to run job: " + err.message;
                return this.save();
            });
    }

    async cancelJob(client: CookClient)
    {
        return client.cancelJob(this.jobId)
            .catch(err => {
                this.state = "error";
                this.error = "Cook service failed to cancel job: " + err.message;
                return this.save();
            });
    }

    async deleteJob(client: CookClient)
    {
        return client.deleteJob(this.jobId)
            .catch(err => {
                this.state = "error";
                this.error = "Cook service failed to delete job: " + err.message;
                return this.save();
            });
    }

    async updateJob(client: CookClient)
    {
        return client.jobInfo(this.jobId)
            .then(async info => {
                if (info.state === "done" || info.state === "error") {
                    this.report = await client.jobReport(this.jobId);
                }

                this.state = info.state;
                this.step = info.step;
                this.error = info.error;
            })
            .catch(err => {
                this.state = "error";
                this.error = "Cook service failed: " + err.message;
            })
            .finally(() => this.save())

    }
}