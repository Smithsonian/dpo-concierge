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

const fs = require("fs");
const path = require("path");

import { IStorage, IFileInfo, ReadStream, WriteStream } from "./Storage";

////////////////////////////////////////////////////////////////////////////////

export default class LocalStorage implements IStorage
{
    readonly basePath: string;

    constructor(basePath?: string)
    {
        this.basePath = basePath;
    }

    protected getStorageUrl(filePath: string)
    {

    }

    async get(filePath: string, version: number): Promise<ReadStream>
    {
        return new Promise((resolve, reject) => {
            resolve(fs.createReadStream(this.getStorageUrl(filePath)));
        });
    }

    async put(filePath: string, version: number): Promise<WriteStream>
    {
        return new Promise((resolve, reject) => {
            resolve(fs.createWriteStream(this.getStorageUrl(filePath)));
        });
    }

    async delete(filePath: string, version: number): Promise<boolean>
    {
        return Promise.resolve(true);
    }

    async info(filePath: string, version: number): Promise<IFileInfo>
    {
        return Promise.resolve(null);
    }
}