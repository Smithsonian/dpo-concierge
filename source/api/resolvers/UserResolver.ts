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

import { Arg, Int, Query, Mutation, Resolver, Ctx } from "type-graphql";

import { User, UserView, UserInput } from "../schemas/User";
import { Status } from "../schemas/Status";
import { ViewParameters, getFindOptions } from "../schemas/View";

import UserModel from "../models/User";
import RoleModel from "../models/Role";
import PermissionModel from "../models/Permission";

////////////////////////////////////////////////////////////////////////////////

export interface IContext
{
    user?: UserModel;
}

@Resolver()
export default class UserResolver
{
    @Query(returns => UserView)
    async userView(
        @Arg("view", type => ViewParameters) view: ViewParameters,
    ): Promise<UserView>
    {
        const findOptions = getFindOptions(view, null, { include: [ RoleModel ]});

        return UserModel.findAndCountAll(findOptions)
        .then(result => ({
            rows: result.rows.map(row => row.toJSON() as User),
            count: result.count,
        }));
    }

    @Query(returns => User)
    async user(
        @Arg("id") id: string
    ): Promise<User>
    {
        return UserModel.findByPk(id, { include: [RoleModel, PermissionModel] })
            .then(row => row ? row.toJSON() as User : null);
    }

    @Query(returns => User, { nullable: true })
    async me(
        @Ctx() context: IContext
    ): Promise<User>
    {
        const user = context.user;
        return Promise.resolve(user ? user.toJSON() as User : null);
    }

    @Mutation(returns => Status)
    async createUser(
        @Arg("user", { nullable: false }) user: UserInput
    ): Promise<Status>
    {
        return UserModel.createWithProject(user.name, user.email, user.password)
            .then(user => ({ ok: true, message: null }))
            .catch(error => ({ ok: false, message: error.message }));
    }

    @Mutation(returns => User)
    async updateUser(
        @Arg("user", { nullable: false }) user: UserInput
    ): Promise<User>
    {
        return UserModel.update(user, { where: { id: user.id }}).then(() =>
            UserModel.findByPk(user.id).then(user => user.toJSON() as User)
        );
    }
}