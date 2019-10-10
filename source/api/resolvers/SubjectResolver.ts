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

import { Arg, Int, Query, Resolver } from "type-graphql";

import { SubjectSchema } from "../schemas/Subject";
import Subject from "../models/Subject";

////////////////////////////////////////////////////////////////////////////////

@Resolver()
export default class ItemResolver
{
    @Query(returns => [ SubjectSchema ])
    subjects(
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    ): Promise<SubjectSchema[]>
    {
        limit = limit ? limit : undefined;

        return Subject.findAll({ offset, limit })
        .then(rows => rows.map(row => row.toJSON() as SubjectSchema));
    }

    @Query(returns => SubjectSchema, { nullable: true })
    subject(
        @Arg("id", type => Int) id: number,
        @Arg("uuid") uuid: string,
    ): Promise<SubjectSchema | null>
    {
        return (id ? Subject.findByPk(id) : Subject.findOne({ where: { uuid }}))
        .then(row => row ? row.toJSON() as SubjectSchema : null);
    }
}