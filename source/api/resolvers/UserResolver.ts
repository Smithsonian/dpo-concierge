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

import { UserSchema, UserInputSchema } from "../schemas/User";
import { StatusSchema } from "../schemas/Status";

import User from "../models/User";
import Role from "../models/Role";
import Permission from "../models/Permission";

////////////////////////////////////////////////////////////////////////////////

export interface IContext
{
    user?: User;
}

@Resolver()
export default class UserResolver
{
    @Query(returns => [ UserSchema ])
    async users(
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    ): Promise<UserSchema[]>
    {
        limit = limit ? limit : undefined;

        return User.findAll({ offset, limit, include: [ Role ] })
        .then(rows => rows.map(row => row.toJSON() as UserSchema));
    }

    @Query(returns => UserSchema)
    async user(
        @Arg("id") id: string
    ): Promise<UserSchema>
    {
        console.log("[UserResolver] - query user");
        return User.findByPk(id, { include: [Role, Permission] })
            .then(row => row ? row.toJSON() as UserSchema : null);
    }

    @Query(returns => UserSchema, { nullable: true })
    async me(
        @Ctx() context: IContext
    ): Promise<UserSchema>
    {
        const user = context.user;
        return Promise.resolve(user ? user.toJSON() as UserSchema : null);
    }

    @Mutation(returns => StatusSchema)
    async createUser(
        @Arg("user", { nullable: false }) user: UserInputSchema
    ): Promise<StatusSchema>
    {
        return User.createWithProject(user.name, user.email, user.password)
            .then(user => ({ ok: true, message: null }))
            .catch(error => ({ ok: false, message: error.message }));
    }

    @Mutation(returns => UserSchema)
    async updateUser(
        @Arg("user", { nullable: false }) user: UserInputSchema
    ): Promise<unknown>
    {
        return User.update(user, { where: { id: user.id }}).then(() =>
            User.findByPk(user.id).then(user => user.toJSON())
        );
    }
}