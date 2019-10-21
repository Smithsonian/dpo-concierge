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

import { Arg, Query, Resolver, Mutation } from "type-graphql";

import { MigrationSheetEntry, MigrationSheetView } from "../schemas/MigrationSheetEntry";

import { Status } from "../schemas/Status";
import { ViewParameters, getFindOptions } from "../schemas/View";

import MigrationSheetEntryModel from "../models/MigrationSheetEntry";
import MigrationSheet from "../utils/MigrationSheet";

////////////////////////////////////////////////////////////////////////////////

const searchFields = [
    "object",
    "unitrecordid",
    "edanrecordid",
    "collectingbody",
    "collection",
    "source",
    "playboxid",
    "legacyplayboxid",
    "notes",
];

@Resolver()
export default class MigrationSheetEntryResolver
{
    @Query(returns => MigrationSheetView)
    async migrationSheetView(
        @Arg("view", type => ViewParameters) view: ViewParameters,
    ): Promise<MigrationSheetView>
    {
        const findOptions = getFindOptions(view, searchFields);

        return MigrationSheetEntryModel.findAndCountAll(findOptions)
            .then(result => ({
                rows: result.rows.map(row => row.toJSON() as MigrationSheetEntry),
                count: result.count,
            }));
    }

    @Query(returns => MigrationSheetEntry)
    async migrationSheetEntry(
        @Arg("id") id: string
    ): Promise<MigrationSheetEntry>
    {
        return MigrationSheetEntryModel.findOne({ where: { id } })
            .then(row => row.toJSON() as MigrationSheetEntry);
    }

    @Mutation(returns => Status)
    async fetchMigrationSheet(
    ): Promise<Status>
    {
        const migration = new MigrationSheet();

        return migration.update()
            .then(() => MigrationSheetEntryModel.importSheet(migration))
            .then(() => ({ ok: true, message: "" }))
            .catch(err => ({ ok: false, message: err.message }));
    }
}

