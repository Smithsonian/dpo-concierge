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

import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";

import MigrationEntrySchema from "../schemas/MigrationEntry";
import MigrationEntryModel from "../models/MigrationEntry";

////////////////////////////////////////////////////////////////////////////////

@Resolver(of => MigrationEntrySchema)
export default class MigrationEntryResolver
{
    @Query(returns => [ MigrationEntrySchema ])
    async migrationEntries(
        @Arg("offset", { defaultValue: 0 }) offset: number,
        @Arg("limit", { defaultValue: 50 }) limit: number,
    ): Promise<MigrationEntrySchema[]>
    {
        return MigrationEntryModel.findAll({ offset, limit: limit ? limit : undefined }).then(rows => rows.map(row => row.toJSON() as MigrationEntrySchema));
    }

    @Query(returns => MigrationEntrySchema)
    async migrationEntry(
        @Arg("id") id: string
    ): Promise<MigrationEntrySchema>
    {
        return MigrationEntryModel.findOne({ where: { id } }).then(row => row.toJSON() as MigrationEntrySchema);
    }
}

