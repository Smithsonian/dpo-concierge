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

import "reflect-metadata";
import { Field, Int, ObjectType, InputType } from "type-graphql";

import { Project } from "./Project";
import { Role } from "./Role";

////////////////////////////////////////////////////////////////////////////////

@ObjectType()
export class UserView
{
    @Field(type => [User])
    rows: User[];

    @Field(type => Int)
    count: number;
}

@ObjectType()
export class User
{
    @Field(type => Int)
    id: number;

    @Field()
    name: string;

    @Field()
    email: string;

    @Field()
    role: Role;

    @Field(type => Project, { nullable: true })
    activeProject: Project;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}

@InputType()
export class UserInput
{
    @Field(type => Int, { nullable: true })
    id: number;

    @Field()
    name: string;

    @Field()
    email: string;

    @Field()
    password: string;
}
