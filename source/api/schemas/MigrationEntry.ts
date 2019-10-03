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
import { Field, Int, ID, ObjectType } from "type-graphql";

////////////////////////////////////////////////////////////////////////////////

@ObjectType()
export default class MigrationEntry
{
    @Field(type => ID)
    id: string;

    @Field()
    object: string;

    @Field()
    unitrecordid: string;

    @Field()
    edanrecordid: string;

    @Field()
    collectingbody: string;

    @Field()
    collection: string;

    @Field()
    scantype: string;

    @Field()
    levelofcompletion: string;

    @Field()
    rawdatastatus: string;

    @Field()
    source: string;

    @Field()
    publiclylisted: boolean;

    @Field()
    publishstatus: string;

    @Field()
    rights: string;

    @Field(type => Int, { nullable: true })
    partscount: number;

    @Field(type => Int, { nullable: true })
    articles: number;

    @Field(type => Int, { nullable: true })
    annotations: number;

    @Field(type => Int, { nullable: true })
    tours: number;

    @Field(type => Int, { nullable: true })
    tourstops: number;

    @Field()
    downloads: boolean;

    @Field({ nullable: true })
    playboxid: string;

    @Field()
    previewlink: string;

    @Field()
    legacyplayboxid: string;

    @Field()
    legacypreviewlink: string;

    @Field()
    shareddrivefolder: string;

    @Field()
    mastermodellocation: string;

    @Field({ nullable: true })
    rawdatasizegb: number;

    @Field({ nullable: true })
    mastermodelsizegb: number;

    @Field()
    notes: string;
}