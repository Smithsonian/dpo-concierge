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

import { Model as BaseModel } from "sequelize";
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    HasMany,
    AfterUpdate,
    AfterUpsert, AfterCreate, AfterDestroy
} from "sequelize-typescript";

import { Container } from "typedi";
import { PubSub } from "graphql-subscriptions";

import Project from "./Project";
import JobBin from "./JobBin";

////////////////////////////////////////////////////////////////////////////////

export interface IJobImplementation extends BaseModel
{
    run: () => Promise<unknown>;
    cancel: () => Promise<unknown>;
    delete: () => Promise<unknown>;
}

export type JobState = "created" | "running" | "done" | "error" | "cancelled";

@Table
export default class Job extends Model<Job>
{
    @AfterCreate
    @AfterUpsert
    @AfterUpdate
    @AfterDestroy
    static async publish()
    {
        console.log("[Job] publish change");
        return Container.get(PubSub).publish("JOB_STATE", { ok: true, message: "update!" });
    }

    @Column
    name: string;

    @Column
    type: string;

    @Column({ defaultValue: "created" })
    state: JobState;

    @Column({ defaultValue: "" })
    step: string;

    @Column({ type: DataType.TEXT })
    error: string;

    @ForeignKey(() => Project)
    @Column
    projectId: number;

    @BelongsTo(() => Project)
    project: Project;

    @HasMany(() => JobBin)
    jobBins: JobBin[];

    async run()
    {
        console.log(`[Job] - run job ${this.id} (${this.state}): ${this.name}`);

        if (this.state !== "created") {
            return Promise.resolve();
        }

        return this.setState("running")
            .then(() => this.getJobImplementation())
            .then(impl => impl.run())
            .catch(error => this.setState("error", error.message));
    }

    async cancel()
    {
        console.log(`[Job] - cancel job ${this.id} (${this.state}): ${this.name}`);

        if (this.state !== "running") {
            return Promise.resolve();
        }

        return this.setState("cancelled")
            .then(() => this.getJobImplementation())
            .then(impl => impl.cancel())
            .catch(error => this.setState("error", error.message));
    }

    async delete()
    {
        console.log(`[Job] - delete job ${this.id} (${this.state}): ${this.name}`);

        this.getJobImplementation()
            .then(impl => impl.delete())
            .then(() => this.destroy());
    }

    async setState(state: JobState, error?: string)
    {
        this.state = state;
        if (error) {
            this.error = error;
        }

        return this.save();
    }

    async setStep(step: string)
    {
        this.step = step;
        return this.save();
    }

    protected async getJobImplementation(): Promise<IJobImplementation>
    {
        const ImplementationModel = Job.sequelize.models[this.type];
        if (!ImplementationModel) {
            throw new Error(`Can't find model for job type '${this.type}'`);
        }
        return ImplementationModel.findOne({ where: { jobId: this.id }})
            .then(impl => {
                if (!impl) {
                    throw new Error(`Can't find implementation for job id ${this.id}`);
                }

                impl["job"] = this;
                return impl as IJobImplementation;
            });
    }
}
