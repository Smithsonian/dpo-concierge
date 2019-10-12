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

import { BinTypeSchema } from "./BinType";
import { ItemSchema } from "./Item";
import { AssetSchema } from "./Asset";

////////////////////////////////////////////////////////////////////////////////

@ObjectType()
export class BinSchema
{
    @Field(type => Int)
    id: number;

    @Field()
    uuid: string;

    @Field(type => Int)
    version: number;

    @Field()
    name: string;

    @Field()
    description: string;

    @Field()
    item: ItemSchema;

    @Field()
    type: BinTypeSchema;

    @Field(type => [AssetSchema])
    assets: AssetSchema[];
}

