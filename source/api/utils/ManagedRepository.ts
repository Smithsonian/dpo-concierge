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
import * as archiver from "archiver";
import * as fetch from "node-fetch";
import { v2 as webdav } from "webdav-server";

import Asset from "../models/Asset";
import Bin from "../models/Bin";

import { IFileStore, ReadStream, WriteStream } from "./FileStore";

////////////////////////////////////////////////////////////////////////////////

export interface IAPISettings
{
    uploadPath: string;
    uploadUrl: string;
    endpoints: {
        upsert: string;
    }
}

export default class ManagedRepository
{
    protected readonly fileStore: IFileStore;
    protected readonly apiSettings: IAPISettings;

    protected webDAVServer: webdav.WebDAVServer;
    protected activeBins: { [id:string]: boolean };

    constructor(fileStore: IFileStore, apiSettings: IAPISettings)
    {
        this.fileStore = fileStore;
        this.apiSettings = apiSettings;

        this.webDAVServer = new webdav.WebDAVServer(/* { port: webDAVPort } */);

        // this.webDAVServer.afterRequest((req, next) => {
        //     // Display the method, the URI, the returned status code and the returned message
        //     console.log(`[Repository.WebDAV] ${req.request.method} ${req.request.url} ` +
        //         `${req.response.statusCode} ${req.response.statusMessage}`);
        //     next();
        // });

        this.activeBins = {};
    }

    get appsPath() {
        return this.fileStore.getStoreFilePath("apps/");
    }

    routeWebDAV()
    {
        return webdav.extensions.express("/", this.webDAVServer)
    }

    async grantWebDAVAccess(bin: Bin): Promise<void>
    {
        return new Promise((resolve, reject) => {
            if (this.activeBins[bin.uuid]) {
                console.log(`[Repository.WebDAV] file access already granted for bin '${bin.uuid}'`);
                return resolve();
            }

            this.activeBins[bin.uuid] = true;

            const physicalPath = this.fileStore.getStoreFilePath(bin.getStoragePathWithVersion());

            this.webDAVServer.setFileSystem("/" + bin.uuid, new webdav.PhysicalFileSystem(physicalPath), success => {
                if (!success) {
                    const message = `failed to mount WebDAV file system at '${physicalPath}'`;
                    console.log(`[Repository.WebDAV] ${message}`);
                    return reject(new Error(message));
                }

                console.log(`[Repository.WebDAV] file access granted for bin '${bin.uuid}', repo path: '${physicalPath}'`);
                return resolve();
            });
        });
    }

    revokeWebDAVAccess(bin: Bin): Promise<void>
    {
        return new Promise((resolve, reject) => {
            if (!this.activeBins[bin.uuid]) {
                return resolve();
            }

            delete this.activeBins[bin.uuid];

            this.webDAVServer.removeFileSystem("/" + bin.uuid, removeCount => {
                if (!removeCount) {
                    const message = `failed to unmount WebDAV file system for bin: '${bin.uuid}'`;
                    console.log(`[Repository.WebDAV] ${message}`);
                    return reject(new Error(message));
                }

                return resolve();
            });
        });
    }

    async deleteAssetFile(asset: Asset)
    {
        return this.fileStore.deleteFile(asset.getStoragePath());
    }

    async deleteBinFolder(bin: Bin)
    {
        return this.fileStore.deleteFolder(bin.getStoragePath());
    }

    async publishSceneBin(bin: Bin, document: Asset)
    {
        return new Promise((resolve, reject) => {

            const apiSettings = this.apiSettings;
            const binPath = this.fileStore.getStoreFilePath(bin.getStoragePathWithVersion());

            const uploadFileName = `${bin.uuid}.zip`;
            const uploadFilePath = path.resolve(apiSettings.uploadPath, uploadFileName);
            console.log(`[ManagedRepository] zipping bin: '${binPath}'`);
            console.log(`[ManagedRepository] to: '${uploadFilePath}'`);

            const stream = fs.createWriteStream(uploadFilePath);
            const archive = archiver("zip", { zlib: { level: 9 }});

            stream.on("close", () => {
                console.log("[ManagedRepository] bin zipped successfully, posting to API");

                const message = {
                    resource: `${apiSettings.uploadUrl}/${uploadFileName}`,
                    document: document.filePath,
                };

                console.log("[ManagedRepository] message: " + JSON.stringify(message));

                fetch(apiSettings.endpoints.upsert, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(message),
                })
                .then(result => {
                    if (!result.ok) {
                        reject(new Error(`Post to API failed with code: ${result.status} ${result.statusText}`));
                    }
                    //fs.unlinkSync(uploadFilePath); // TODO: Uncomment after testing
                    resolve()
                })
                .catch(error => {
                    //fs.unlinkSync(uploadFilePath); // TODO: Uncomment after testing
                    console.log(`[ManagedRepository] failed to publish to '${apiSettings.endpoints.upsert}': ${error}`);
                    reject(error)
                });
            });

            archive.on("warning", error => {
                if (error.code === "ENOENT") {
                    console.log(`[ManagedRepository] - Warning while writing ZIP archive: ${error.toString()}`);
                }
                else {
                    reject(error);
                }
            });

            archive.on("error", error => {
                console.log(`[ManagedRepository] - Error while writing ZIP archive: ${error.toString()}`);
                reject(error);
            });

            archive.pipe(stream);
            archive.directory(binPath, false); // archive root folder
            archive.finalize();
        });

    }

    async readFile(targetFilePath: string, filePath: string, binUuid: string, binVersion?: number)
    {
        return Asset.findByBinVersion(filePath, binUuid, binVersion)
            .then(asset => {
                if (!asset) {
                    return null;
                }

                return this.fileStore.readFile(asset.getStoragePath(), targetFilePath)
            });
    }

    async createReadStream(filePath: string, binUuid: string, binVersion?: number): Promise<ReadStream>
    {
        return Asset.findByBinVersion(filePath, binUuid, binVersion)
            .then(asset => {
                if (!asset) {
                    return null;
                }

                return this.fileStore.createReadStream(asset.getStoragePath())
            });
    }

    async writeFile(sourceFilePath: string, filePath: string, binId: number, overwrite?: boolean)
    {
        let bin: Bin = undefined;
        let asset: Asset = undefined;

        let storageFilePath: string = undefined;

        return Bin.findByPk(binId)
        .then(_bin => {
            bin = _bin;
            return Asset.create({
                filePath,
                binId: bin.id,
            });
        })
        .then(_asset => {
            asset = _asset;
            asset.bin = bin;
            storageFilePath = asset.getStoragePath();
            return this.fileStore.writeFile(sourceFilePath, storageFilePath)
        })
        .then(() => this.fileStore.getFileInfo(storageFilePath))
        .then(stats => {
            asset.byteSize = stats.byteSize;
            return asset.save();
        })
        .catch(error => {
            if (asset) {
                return asset.destroy().then(() => { throw error; });
            }
        });
    }

    async createWriteStream(filePath: string, binId: number, overwrite?: boolean): Promise<{ asset: Asset, stream: WriteStream }>
    {
        let bin: Bin = undefined;
        let asset: Asset = undefined;

        return Bin.findByPk(binId)
        .then(_bin => {
            bin = _bin;
            return Asset.create({
                filePath,
                binId: bin.id
            });
        })
        .then(_asset => {
            asset = _asset;
            asset.bin = bin;
            return this.fileStore.createWriteStream(asset.getStoragePath());
        })
        .then(stream => ({ stream, asset }));
    }
}