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
import * as mkdirp from "mkdirp";

import { IFileStore, IFileInfo, ReadStream, WriteStream } from "./FileStore";

////////////////////////////////////////////////////////////////////////////////
// ENVIRONMENT VARIABLES

//const fileStorePath = process.env["FILE_STORE_BASEPATH"];

////////////////////////////////////////////////////////////////////////////////

export default class LocalFileStore implements IFileStore
{
    public readonly storePath: string;

    constructor(storePath: string)
    {
        this.storePath = storePath;
    }

    async readFile(filePath: string, targetPath: string): Promise<unknown>
    {
        const storageFilePath = this.getStoreFilePath(filePath);

        return this.createPath(targetPath)
            .then(() => fs.promises.copyFile(storageFilePath, targetPath));
    }

    async writeFile(sourcePath: string, filePath: string): Promise<unknown>
    {
        const storageFilePath = this.getStoreFilePath(filePath);

        return this.createPath(storageFilePath)
            .then(() => fs.promises.copyFile(sourcePath, storageFilePath));
    }

    async moveFile(sourcePath: string, destinationPath: string): Promise<unknown>
    {
        const storageSourcePath = this.getStoreFilePath(sourcePath);
        const storageDestinationPath = this.getStoreFilePath(destinationPath);

        return this.createPath(storageDestinationPath)
            .then(() => fs.promises.rename(storageSourcePath, storageDestinationPath));
    }

    async deleteFile(filePath: string): Promise<unknown>
    {
        return fs.promises.unlink(this.getStoreFilePath(filePath));
    }

    async getFileInfo(filePath: string): Promise<IFileInfo>
    {
        return fs.promises.stat(this.getStoreFilePath(filePath))
            .then(stats => {
                const pathSegs = filePath.split("/");
                const name = pathSegs.pop();
                const nameSegs = name.split(".");
                const path = pathSegs.join("/");
                const extension = nameSegs.pop();
                const baseName = nameSegs.join(".");

                return {
                    filePath,
                    path,
                    name,
                    baseName,
                    extension,
                    byteSize: stats.size,
                };
            });
    }

    async createReadStream(filePath: string): Promise<ReadStream>
    {
        return new Promise((resolve, reject) => {
            resolve(fs.createReadStream(this.getStoreFilePath(filePath)));
        });
    }

    async createWriteStream(filePath: string): Promise<WriteStream>
    {
        const storageFilePath = this.getStoreFilePath(filePath);

        return this.createPath(storageFilePath)
            .then(() => fs.createWriteStream(storageFilePath));
    }

    protected async createPath(filePath: string)
    {
        return new Promise((resolve, reject) => {
            const segments = filePath.split("/");
            segments.pop();
            const pathName = segments.join("/");

            mkdirp(pathName, null, (err, made) => {
                if (err) {
                    return reject(err);
                }

                resolve(made);
            });
        });
    }

    protected getStoreFilePath(filePath: string)
    {
        return path.resolve(this.storePath, filePath);
    }
}