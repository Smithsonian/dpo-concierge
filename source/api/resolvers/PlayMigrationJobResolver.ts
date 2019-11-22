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

import { Arg, Query, Mutation, Resolver, Ctx, Int } from "type-graphql";

import { PlayMigrationJobSchema, PlayMigrationJobInput } from "../schemas/PlayMigrationJob";

import PlayMigrationJobModel from "../models/PlayMigrationJob";
import UserModel from "../models/User";

////////////////////////////////////////////////////////////////////////////////

export interface IContext
{
    user?: UserModel;
}

@Resolver()
export default class PlayMigrationJobResolver
{
    @Mutation(returns => PlayMigrationJobSchema, { nullable: true })
    async createPlayMigrationJob(
        @Arg("playMigrationJob") playMigrationJob: PlayMigrationJobInput,
        @Ctx() context: IContext,
    ): Promise<PlayMigrationJobSchema>
    {
        const projectId = context.user.activeProjectId;
        if (!projectId) {
            throw new Error("no active project set");
        }

        const params = {
            ...playMigrationJob,
            name: `Play Box Migration: #${playMigrationJob.playboxId} - ${playMigrationJob.object}`,
            projectId,
        };

        return PlayMigrationJobModel.createJob(params)
            .then(migrationJob => migrationJob.toJSON() as PlayMigrationJobSchema);

        // const baseData = {
        //     name: playMigrationJob.name,
        //     type: "PlayMigrationJob",
        //     projectId
        // };
        //
        // const jobEntry = await JobModel.create(baseData);
        // const playMigrationJobEntry = await PlayMigrationJobModel.create(playMigrationJob);
        // await playMigrationJobEntry.$set("job", jobEntry);
        //
        // return playMigrationJobEntry.toJSON() as PlayMigrationJobSchema;
    }

}