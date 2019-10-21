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

import { Table, Column, Model, DataType } from "sequelize-typescript";

import MigrationSheet from "../utils/MigrationSheet";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class MigrationSheetEntry extends Model<MigrationSheetEntry>
{
    static async importSheet(sheet: MigrationSheet)
    {
        const rows = sheet.data.worksheets[0].rows;

        let p: Promise<any> = Promise.resolve();
        rows.forEach(row =>
            p = p.then(() => this.upsert(row))
        );

        return p;
    }

    @Column({ primaryKey: true })
    id: string;

    @Column
    object: string;

    @Column
    unitrecordid: string;

    @Column
    edanrecordid: string;

    @Column
    collectingbody: string;

    @Column
    collection: string;

    @Column
    scantype: string;

    @Column
    levelofcompletion: string;

    @Column
    rawdatastatus: string;

    @Column
    source: string;

    @Column
    publiclylisted: boolean;

    @Column
    publishstatus: string;

    @Column
    rights: string;

    @Column({ type: DataType.INTEGER })
    partscount: number;

    @Column({ type: DataType.INTEGER })
    articles: number;

    @Column({ type: DataType.INTEGER })
    annotations: number;

    @Column({ type: DataType.INTEGER })
    tours: number;

    @Column({ type: DataType.INTEGER })
    tourstops: number;

    @Column({ type: DataType.BOOLEAN })
    downloads: boolean;

    @Column
    playboxid: string;

    @Column
    previewlink: string;

    @Column
    legacyplayboxid: string;

    @Column
    legacypreviewlink: string;

    @Column
    shareddrivefolder: string;

    @Column
    mastermodellocation: string;

    @Column
    rawdatasizegb: number;

    @Column
    mastermodelsizegb: number;

    @Column({ type: DataType.TEXT })
    notes: string;
}
