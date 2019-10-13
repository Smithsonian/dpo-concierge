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

import { Arg, Query, Mutation, Int, Resolver, Ctx } from "type-graphql";

import { JobSchema } from "../schemas/Job";
import { StatusSchema } from "../schemas/Status";

import Job from "../models/Job";
import User from "../models/User";

////////////////////////////////////////////////////////////////////////////////

export interface IContext
{
    user?: User;
}

@Resolver()
export default class JobResolver
{
    /**
     * Returns the jobs for the active project.
     * @param offset
     * @param limit
     * @param context
     */
    @Query(returns => [ JobSchema ])
    async jobs(
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
        @Ctx() context: IContext,
    ): Promise<JobSchema[]>
    {
        limit = limit ? limit : undefined;
        const projectId = context.user.activeProjectId;

        if (projectId === null) {
            return Promise.resolve([]);
        }

        return Job.findAll({ where: { projectId }, offset, limit })
            .then(rows => rows.map(row => row.toJSON() as JobSchema));
    }

    @Query(returns => JobSchema, { nullable: true })
    async job(
        @Arg("id", type => Int) id: number,
    ): Promise<JobSchema | null>
    {
        if (id) {
            return Job.findByPk(id)
                .then(row => row ? row.toJSON() as JobSchema : null);
        }

        return Promise.resolve(null);
    }

    @Mutation(returns => StatusSchema)
    async runJob(
        @Arg("jobId", type => Int) jobId: number
    ): Promise<StatusSchema>
    {
        return Job.findByPk(jobId)
            .then(job => job.run())
            .then(() => ({ ok: true, message: null }))
            .catch(err => ({ ok: false, message: err.message }));
    }

    @Mutation(returns => StatusSchema)
    async cancelJob(
        @Arg("jobId", type => Int) jobId: number
    ): Promise<StatusSchema>
    {
        return Job.findByPk(jobId)
        .then(job => job.cancel())
        .then(() => ({ ok: true, message: null }))
        .catch(err => ({ ok: false, message: err.message }));
    }

    @Mutation(returns => StatusSchema)
    async deleteJob(
        @Arg("jobId", type => Int) jobId: number
    ): Promise<StatusSchema>
    {
        return Job.findByPk(jobId)
        .then(job => job.delete())
        .then(() => ({ ok: true, message: null }))
        .catch(err => ({ ok: false, message: err.message }));
    }

    // @Subscription({
    //     topics: "JOB_STATE"
    // })
    // jobStateChange(): Promise<JobType[]>
    // {
    //     return Promise.resolve([]);
    // }
}