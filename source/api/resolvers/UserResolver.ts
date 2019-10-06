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

import { UserType, UserInput } from "../schemas/User";
import User from "../models/User";

////////////////////////////////////////////////////////////////////////////////

export interface IContext
{
    user?: User;
}

@Resolver()
export default class UserResolver
{
    @Query(returns => UserType, { nullable: true })
    async me(
        @Ctx() context: IContext
    ): Promise<UserType>
    {
        return Promise.resolve(context.user ? context.user.toJSON() as UserType : null);
    }

    @Query(returns => UserType)
    async user(
        @Arg("id") id: string
    ): Promise<UserType>
    {
        return User.findOne({ where: { id } }).then(row => row.toJSON() as UserType);
    }

    @Query(returns => [ UserType ])
    async users(
        @Arg("offset", { defaultValue: 0 }) offset: number,
        @Arg("limit", { defaultValue: 50 }) limit: number,
    ): Promise<UserType[]>
    {
        return User.findAll({ offset, limit: limit ? limit : undefined })
            .then(rows => rows.map(row => row.toJSON() as UserType));
    }

    @Mutation(returns => UserType)
    async insertUser(
        @Arg("user", { nullable: false }) user: UserInput
    ): Promise<UserType>
    {
        return User.findOne({ where: { email: user.email }})
            .then(user => {
                if (user) {
                    throw new Error(`User with email '${user.email} already registered.`);
                }
            })
            .then(() => User.getPasswordHash(user.password))
            .then(hash => User.create({ name: user.name, email: user.email, password: hash }))
            .then(user => user.toJSON() as UserType);
    }

    @Mutation(returns => UserType)
    async updateUser(
        @Arg("user", { nullable: false }) user: UserInput
    ): Promise<unknown>
    {
        return User.update(user, { where: { id: user.id }}).then(() =>
            User.findOne({ where: { id: user.id }}).then(user => user.toJSON())
        );
    }
}