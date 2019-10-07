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

import { PlayMigrationJobType, PlayMigrationJobInput } from "../schemas/PlayMigrationJob";
import { JobType } from "../schemas/Job";

import PlayMigrationJob from "../models/PlayMigrationJob";
import Job from "../models/Job";
import User from "../models/User";

////////////////////////////////////////////////////////////////////////////////

export interface IContext
{
    user?: User;
}

@Resolver()
export default class PlayMigrationJobResolver
{
    @Mutation(returns => PlayMigrationJobType, { nullable: true })
    async createPlayMigrationJob(
        @Arg("playMigrationJob") playMigrationJob: PlayMigrationJobInput,
        @Ctx() context: IContext,
    ): Promise<PlayMigrationJobType>
    {
        const projectId = context.user.activeProjectId;
        if (!projectId) {
            throw new Error("no active project set");
        }

        const baseData = {
            name: playMigrationJob.name,
            type: "PlayMigrationJob",
            projectId
        };

        const jobEntry = await Job.create(baseData);
        const playMigrationJobEntry = await PlayMigrationJob.create(playMigrationJob);
        await playMigrationJobEntry.$set("job", jobEntry);

        return playMigrationJobEntry.toJSON() as PlayMigrationJobType;
    }

}