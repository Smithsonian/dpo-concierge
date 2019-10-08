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

import * as fs from "fs";
import * as path from "path";
import * as GoogleSpreadsheet  from "google-spreadsheet";

////////////////////////////////////////////////////////////////////////////////
// ENVIRONMENT VARIABLES

const sheetKey = process.env["MIGRATION_SPREADSHEET_KEY"];
const googleAccountInfoFile = process.env["GOOGLE_SERVICE_ACCOUNT_INFO"];

////////////////////////////////////////////////////////////////////////////////

export interface Spreadsheet
{
    id: string;
    title: string;
    updated: string;
    author: {
        name: string;
        email: string;
    }
    worksheets: Worksheet[];
}

export interface Worksheet
{
    info: WorksheetInfo;
    rows: object[];
}

export interface WorksheetInfo
{
    url: string;
    id: string;
    title: string;
    rowCount: number;
    colCount: number;
}

export default class MigrationSheet
{
    static readonly basePath: string = path.resolve(__dirname, "../../../.."); // project root

    public data: Spreadsheet = null;

    async update(): Promise<unknown>
    {
        return new Promise<Promise<unknown>[]>((resolve, reject) => {
            const document = new GoogleSpreadsheet(sheetKey);
            const accountPath = path.resolve(MigrationSheet.basePath, googleAccountInfoFile);
            console.log(sheetKey, accountPath);
            let tasks;

            fs.readFile(accountPath, "utf8", (err, data) => {
                if (err) {
                    return reject(err);
                }

                const credentials = JSON.parse(data);
                document.useServiceAccountAuth(credentials, (err) => {
                    if (err) {
                        return reject(err);
                    }

                    document.getInfo((err, info) => {
                        if (err) {
                            return reject(err);
                        }

                        delete info["_links"];
                        this.data = info;
                        this.data.worksheets = info.worksheets.map(worksheetInfo => {
                            delete worksheetInfo["_links"];
                            return {
                                info: worksheetInfo,
                                rows: []
                            };
                        });

                        console.log(`MigrationSheet.update - document: ${info.title} by ${info.author.email}`);

                        tasks = this.data.worksheets.map((worksheet, index) => {

                            console.log(`MigrationSheet.update - worksheet: ${worksheet.info.title}`);

                            return this.getRows(document, index, 0, 1000).then(rows => {
                                rows.forEach(row => {
                                    delete row["_xml"];
                                    delete row["_links"];
                                    delete row["app:edited"];

                                    row["publiclylisted"] = row["publiclylisted"] === "Yes";

                                    row["partscount"] = parseInt(row["partscount"]) || null;
                                    row["articles"] = parseInt(row["articles"]) || null;
                                    row["annotations"] = parseInt(row["annotations"]) || null;
                                    row["tours"] = parseInt(row["tours"]) || null;
                                    row["tourstops"] = parseInt(row["tourstops"]) || null;

                                    row["downloads"] = row["downloads"] === "Yes";

                                    const playboxId = Number.parseInt(row["playboxid"]);
                                    row["playboxid"] = Number.isFinite(playboxId) ? row["playboxid"] : null;

                                    row["rawdatasizegb"] = parseFloat(row["rawdatasizegb"]) || null;
                                    row["mastermodelsizegb"] = parseFloat(row["mastermodelsizegb"]) || null;
                                });
                                this.data.worksheets[index].rows = rows;
                            });
                        });

                        resolve(tasks);
                    });
                });
            });
        })
        .then(tasks => Promise.all(tasks))
        .then(() => console.log("MigrationSheet.update - done."));
    }

    async getRows(document, sheetIndex: number, start: number, count: number, orderBy?: string, query?: string): Promise<object[]>
    {
        return new Promise((resolve, reject) => {

            document.getRows(sheetIndex + 1, { offset: start, limit: count, orderBy, query }, (err, rows) => {
                if (err) {
                    return reject(err);
                }

                resolve(rows);
            });
        });
    }

    async writePlayboxIds(document)
    {
        const rows = await this.getRows(document, 0, 0, 1000, "playboxid", "source = \"Play\" or source = \"Legacy -> Play\"");
        const ids = rows.map(row => row["playboxid"]);

        return fs.promises.writeFile("playboxIds.json", JSON.stringify(ids));
    }
}