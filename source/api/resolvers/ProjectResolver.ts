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

import { ProjectView, Project, ProjectInput } from "../schemas/Project";
import { ViewParameters, getFindOptions } from "../schemas/View";

import ProjectModel from "../models/Project";
import UserModel from "../models/User";

////////////////////////////////////////////////////////////////////////////////

const searchFields = [
    "name"
];

export interface IContext
{
    user?: UserModel;
}

@Resolver()
export default class ProjectResolver
{
    @Query(returns => ProjectView)
    async projectView(
        @Arg("view", type => ViewParameters) view: ViewParameters,
        @Ctx() context: IContext,
    ): Promise<ProjectView>
    {
        const where = { ownerId: context.user.id };
        const findOptions = getFindOptions(view, searchFields, { where });

        return ProjectModel.findAndCountAll(findOptions)
            .then(result => ({
                rows: result.rows.map(row => row.toJSON() as Project),
                count: result.count,
            }));
    }

    @Query(returns => Project, { nullable: true })
    async project(
        @Arg("id", type => Int) id: number,
        @Ctx() context: IContext,
    ): Promise<Project>
    {
        const ownerId = context.user.id;

        return ProjectModel.findOne({ where: { id, ownerId }})
            .then(row => row ? row.toJSON() as Project : null);
    }

    @Mutation(returns => Project, { nullable: true })
    async upsertProject(
        @Arg("project") project: ProjectInput,
        @Ctx() context: IContext,
    ): Promise<Project>
    {
        const id = project.id;
        const ownerId = context.user.id;

        if (id) {
            return ProjectModel.update(project, { where: { id, ownerId }})
                .then(() => ProjectModel.findOne({ where: { id, ownerId }}))
                .then(row => row ? row.toJSON() as Project : null);
        }

        return ProjectModel.create({ ...project, ownerId })
            .then(row => row.toJSON() as Project);
    }

    @Mutation(returns => Project, { nullable: true })
    async setActiveProject(
        @Arg("id", type => Int) id: number,
        @Ctx() context: IContext,
    ): Promise<Project>
    {
        const ownerId = context.user.id;

        return ProjectModel.findOne({ where: { id, ownerId }})
            .then(project => {
                if (project) {
                    return context.user.update({ activeProjectId: project.id })
                        .then(() => project.toJSON() as Project);
                }

                return null;
            });
    }
}