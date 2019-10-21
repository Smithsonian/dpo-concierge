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

import { Arg, Query, Mutation, Int, Resolver, Ctx, Subscription, Root } from "type-graphql";

import { Container } from "typedi";
import { PubSub } from "graphql-subscriptions";

import { Job, JobView } from "../schemas/Job";
import { Status } from "../schemas/Status";
import { ViewParameters, getFindOptions } from "../schemas/View";

import JobModel from "../models/Job";
import UserModel from "../models/User";

////////////////////////////////////////////////////////////////////////////////

export interface IContext
{
    user?: UserModel;
}

@Resolver()
export default class JobResolver
{
    /**
     * Returns the jobs for the active project.
     * @param view View parameters
     * @param context
     */
    @Query(returns => JobView)
    async jobView(
        @Arg("view", type => ViewParameters) view: ViewParameters,
        @Ctx() context: IContext,
    ): Promise<JobView>
    {
        const projectId = context.user.activeProjectId;

        if (projectId === null) {
            return Promise.resolve({ rows: [], count: 0 });
        }

        const findOptions = getFindOptions(view, null, { where: { projectId }});

        return JobModel.findAndCountAll(findOptions)
        .then(result => ({
            rows: result.rows.map(row => row.toJSON() as Job),
            count: result.count,
        }));
    }

    @Query(returns => Job, { nullable: true })
    async job(
        @Arg("id", type => Int) id: number,
    ): Promise<Job | null>
    {
        if (id) {
            return JobModel.findByPk(id)
                .then(row => row ? row.toJSON() as Job : null);
        }

        return Promise.resolve(null);
    }

    @Mutation(returns => Status)
    async runJob(
        @Arg("jobId", type => Int) jobId: number
    ): Promise<Status>
    {
        return JobModel.findByPk(jobId)
            .then(job => job.run())
            .then(() => ({ ok: true, message: null }))
            .catch(err => ({ ok: false, message: err.message }));
    }

    @Mutation(returns => Status)
    async cancelJob(
        @Arg("jobId", type => Int) jobId: number
    ): Promise<Status>
    {
        return JobModel.findByPk(jobId)
        .then(job => job.cancel())
        .then(() => ({ ok: true, message: null }))
        .catch(err => ({ ok: false, message: err.message }));
    }

    @Mutation(returns => Status)
    async deleteJob(
        @Arg("jobId", type => Int) jobId: number
    ): Promise<Status>
    {
        return JobModel.findByPk(jobId)
        .then(job => job.delete())
        .then(() => ({ ok: true, message: null }))
        .catch(err => ({ ok: false, message: err.message }));
    }

    @Subscription({
        subscribe: () => Container.get(PubSub).asyncIterator("JOB_STATE"),
    })
    jobStateChange(
        @Root() payload: { ok: boolean, message: string },
    ): Status
    {
        console.log("[JobResolver] publish change - ", payload.message);
        return payload;
    }
}