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

import { ProjectSchema, ProjectInputSchema } from "../schemas/Project";

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
    @Query(returns => [ ProjectSchema ])
    async projects(
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
        @Ctx() context: IContext,
    ): Promise<ProjectSchema[]>
    {
        limit = limit ? limit : undefined;
        const ownerId = context.user.id;

        return Project.findAll({ where: { ownerId }, offset, limit })
            .then(rows => rows.map(row => row.toJSON() as ProjectSchema));
    }

    @Query(returns => ProjectSchema, { nullable: true })
    async project(
        @Arg("id", type => Int) id: number,
        @Ctx() context: IContext,
    ): Promise<ProjectSchema>
    {
        const ownerId = context.user.id;

        return Project.findOne({ where: { id, ownerId }})
            .then(row => row ? row.toJSON() as ProjectSchema : null);
    }

    @Mutation(returns => ProjectSchema, { nullable: true })
    async upsertProject(
        @Arg("project") project: ProjectInputSchema,
        @Ctx() context: IContext,
    ): Promise<ProjectSchema>
    {
        const id = project.id;
        const ownerId = context.user.id;

        if (id) {
            return Project.update(project, { where: { id, ownerId }})
                .then(() => Project.findOne({ where: { id, ownerId }}))
                .then(row => row ? row.toJSON() as ProjectSchema : null);
        }

        return Project.create({ ...project, ownerId })
            .then(row => row.toJSON() as ProjectSchema);
    }

    @Mutation(returns => ProjectSchema, { nullable: true })
    async setActiveProject(
        @Arg("id", type => Int) id: number,
        @Ctx() context: IContext,
    ): Promise<ProjectSchema>
    {
        const ownerId = context.user.id;

        return Project.findOne({ where: { id, ownerId }})
            .then(project => {
                if (project) {
                    return context.user.update({ activeProjectId: project.id })
                        .then(() => project.toJSON() as ProjectSchema);
                }

                return null;
            });
    }
}