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

import { Arg, Int, Query, Resolver, Mutation } from "type-graphql";
import { Op } from "sequelize";

import { MigrationSheetEntryType } from "../schemas/MigrationSheetEntry";
import MigrationSheetEntry from "../models/MigrationSheetEntry";

import MigrationSheet from "../utils/MigrationSheet";

////////////////////////////////////////////////////////////////////////////////

@Resolver()
export default class MigrationSheetEntryResolver
{
    @Query(returns => [ MigrationSheetEntryType ])
    async migrationSheetEntries(
        @Arg("search", { nullable: true }) search: string,
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    ): Promise<MigrationSheetEntryType[]>
    {
        limit = limit ? limit : undefined;
        let where = undefined;

        if (search) {
            where = {
                [Op.or]: [
                    { "object": { [Op.substring]: search } },
                    { "unitrecordid": { [Op.substring]: search } },
                    { "edanrecordid": { [Op.substring]: search } },
                    { "collectingbody": { [Op.substring]: search } },
                    { "collection": { [Op.substring]: search } },
                    { "source": { [Op.substring]: search } },
                    { "playboxid": { [Op.substring]: search } },
                    { "legacyplayboxid": { [Op.substring]: search } },
                    { "notes": { [Op.substring]: search } },
                ]
            };
        }

        return MigrationSheetEntry.findAll({ where, offset, limit })
            .then(rows => rows.map(row => row.toJSON() as MigrationSheetEntryType));
    }

    @Query(returns => MigrationSheetEntryType)
    async migrationSheetEntry(
        @Arg("id") id: string
    ): Promise<MigrationSheetEntryType>
    {
        return MigrationSheetEntry.findOne({ where: { id } })
            .then(row => row.toJSON() as MigrationSheetEntryType);
    }

    @Mutation(returns => [ MigrationSheetEntryType ])
    async updateMigrationSheetEntries(
        @Arg("offset", { defaultValue: 0 }) offset: number,
        @Arg("limit", { defaultValue: 50 }) limit: number,
    ): Promise<MigrationSheetEntryType[]>
    {
        const migration = new MigrationSheet();
        return migration.update()
            .then(() => MigrationSheetEntry.importSheet(migration))
            .then(() => MigrationSheetEntry.findAll({ offset, limit: limit ? limit : undefined }))
            .then(rows => rows.map(row => row.toJSON() as MigrationSheetEntryType));
    }
}

