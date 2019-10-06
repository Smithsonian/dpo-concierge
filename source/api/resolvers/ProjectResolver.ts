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

import { Arg, Query, Mutation, Resolver, Ctx } from "type-graphql";

import { ProjectType, ProjectInput } from "../schemas/Project";
import Project from "../models/Project";

import User from "../models/User";

////////////////////////////////////////////////////////////////////////////////

export interface IContext
{
    user?: User;
}

@Resolver()
export default class ProjectResolver
{
    @Query(returns => [ ProjectType ])
    async projects(
        @Arg("offset", { defaultValue: 0 }) offset: number,
        @Arg("limit", { defaultValue: 50 }) limit: number,
    ): Promise<ProjectType[]>
    {
        return Project.findAll({ offset, limit: limit ? limit : undefined })
            .then(rows => rows.map(row => row.toJSON() as ProjectType));
    }

}