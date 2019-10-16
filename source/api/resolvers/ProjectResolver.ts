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

import { ProjectViewType, ProjectType, ProjectInput } from "../schemas/Project";

import { ViewInputType, getFindOptions } from "../schemas/View";

import Project from "../models/Project";
import User from "../models/User";

////////////////////////////////////////////////////////////////////////////////

const searchFields = [
    "name"
];

export interface IContext
{
    user?: User;
}

@Resolver()
export default class ProjectResolver
{
    @Query(returns => ProjectViewType)
    async projectView(
        @Arg("view", type => ViewInputType) view: ViewInputType,
        @Ctx() context: IContext,
    ): Promise<ProjectViewType>
    {
        const where = { ownerId: context.user.id };
        const findOptions = getFindOptions(view, searchFields, { where });

        return Project.findAndCountAll(findOptions)
            .then(result => ({
                rows: result.rows.map(row => row.toJSON() as ProjectType),
                count: result.count,
            }));
    }

    @Query(returns => ProjectType, { nullable: true })
    async project(
        @Arg("id", type => Int) id: number,
        @Ctx() context: IContext,
    ): Promise<ProjectType>
    {
        const ownerId = context.user.id;

        return Project.findOne({ where: { id, ownerId }})
            .then(row => row ? row.toJSON() as ProjectType : null);
    }

    @Mutation(returns => ProjectType, { nullable: true })
    async upsertProject(
        @Arg("project") project: ProjectInput,
        @Ctx() context: IContext,
    ): Promise<ProjectType>
    {
        const id = project.id;
        const ownerId = context.user.id;

        if (id) {
            return Project.update(project, { where: { id, ownerId }})
                .then(() => Project.findOne({ where: { id, ownerId }}))
                .then(row => row ? row.toJSON() as ProjectType : null);
        }

        return Project.create({ ...project, ownerId })
            .then(row => row.toJSON() as ProjectType);
    }

    @Mutation(returns => ProjectType, { nullable: true })
    async setActiveProject(
        @Arg("id", type => Int) id: number,
        @Ctx() context: IContext,
    ): Promise<ProjectType>
    {
        const ownerId = context.user.id;

        return Project.findOne({ where: { id, ownerId }})
            .then(project => {
                if (project) {
                    return context.user.update({ activeProjectId: project.id })
                        .then(() => project.toJSON() as ProjectType);
                }

                return null;
            });
    }
}