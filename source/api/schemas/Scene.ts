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
import { Field, Int, ObjectType } from "type-graphql";

import { Asset } from "./Asset";
import { Bin } from "./Bin";

////////////////////////////////////////////////////////////////////////////////

@ObjectType()
export class SceneView
{
    @Field(type => [Scene])
    rows: Scene[];

    @Field(type => Int)
    count: number;
}

@ObjectType()
export class Scene
{
    @Field(type => Int)
    id: number;

    @Field()
    uuid: string;

    @Field()
    name: string;

    @Field()
    bin: Bin;

    @Field()
    voyagerDocument: Asset;

    @Field()
    voyagerVersion: string;

    @Field()
    published: boolean;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}

