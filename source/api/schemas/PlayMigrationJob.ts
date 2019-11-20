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
import { Field, Int, ID, ObjectType, InputType } from "type-graphql";

////////////////////////////////////////////////////////////////////////////////

@ObjectType()
export class PlayMigrationJobSchema
{
    @Field(type => Int)
    id: number;

    @Field()
    object: string;

    @Field()
    playboxId: string;

    @Field()
    edanRecordId: string;

    @Field()
    masterModelGeometry: string;

    @Field()
    masterModelTexture: string;

    @Field()
    annotationStyle: string;

    @Field()
    migrateAnnotationColor: boolean;

    @Field()
    createReadingSteps: boolean;

}

@InputType()
export class PlayMigrationJobInput
{
    @Field(type => Int, { nullable: true })
    id: number;

    @Field()
    name: string;

    @Field()
    object: string;

    @Field()
    playboxId: string;

    @Field()
    edanRecordId: string;

    @Field()
    unitRecordId: string;

    @Field()
    masterModelGeometry: string;

    @Field()
    masterModelTexture: string;

    @Field()
    annotationStyle: string;

    @Field()
    migrateAnnotationColor: boolean;

    @Field()
    createReadingSteps: boolean;

    @Field(type => ID, { nullable: true })
    sheetEntryId: string;
}