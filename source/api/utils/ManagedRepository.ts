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

type EventCallback = (context: webdav.RequestContext, fileSystem: webdav.FileSystem, path: webdav.Path, data?: any) => void;
type MoveData = { pathFrom: webdav.Path, pathTo: webdav.Path, overwrite: boolean, overrided: boolean };

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

        this.webDAVServer.on("create", async (ctx: webdav.RequestContext, fs: webdav.PhysicalFileSystem, path: webdav.Path) => {

            let filePath = path.toString();
            if (filePath.startsWith("/")) {
                filePath = filePath.substr(1);
            }
            console.log(`[WebDAV] Create: ${filePath}`);

            const bin = await this.findBinFromPath(fs.rootPath);

            if (bin) {
                const asset = await Asset.findByBinId(filePath, bin.id);
                if (!asset) {
                    await Asset.create({
                        filePath,
                        binId: bin.id,
                    });
                }
            }
            else {
                console.error(`[WebDAV] ERROR: Failed to find bin for path: ${fs.rootPath}`);
            }
        });

        this.webDAVServer.on("move", async (ctx: webdav.RequestContext, fs: webdav.PhysicalFileSystem, path: webdav.Path, data: MoveData) => {

            let filePath = path.toString();
            if (filePath.startsWith("/")) {
                filePath = filePath.substr(1);
            }
            console.log(`[WebDAV] Move: ${filePath}`);

            const bin = await this.findBinFromPath(fs.rootPath);

            if (bin) {
                // TODO: Implement 'rename asset'
            }
            else {
                console.error(`[WebDAV] ERROR: Failed to find bin for path: ${fs.rootPath}`);
            }

            console.log(data.pathFrom.toString());
            console.log(data.pathTo.toString());
        });

        this.webDAVServer.on("delete", async (ctx: webdav.RequestContext, fs: webdav.PhysicalFileSystem, path: webdav.Path) => {

            let filePath = path.toString();
            if (filePath.startsWith("/")) {
                filePath = filePath.substr(1);
            }
            console.log(`[WebDAV] Delete: ${filePath}`);

            const bin = await this.findBinFromPath(fs.rootPath);

            if (bin) {
                const asset = await Asset.findByBinId(filePath, bin.id);
                if (asset) {
                    await asset.destroy();
                }
                else {
                    console.error(`[WebDAV] ERROR: Failed to find asset for path: ${filePath}`);
                }
            }
            else {
                console.error(`[WebDAV] ERROR: Failed to find bin for path: ${fs.rootPath}`);
            }
        });

        // this.webDAVServer.afterRequest((req, next) => {
        //     // Display the method, the URI, the returned status code and the returned message
        //     console.log(`[Repository.WebDAV] ${req.request.method} ${req.request.url} ` +
        //         `${req.response.statusCode} ${req.response.statusMessage}`);
        //     next();
        // });

        this.activeBins = {};
    }

    protected async findBinFromPath(path: string): Promise<Bin | null>
    {
        const components = path.split("/");
        const index = components.indexOf("bins");
        if (index < 0) {
            return null;
        }

        const binId = components[index + 1];
        const version = parseInt(components[index + 2].substr(1));

        return Bin.findByUuidAndVersion(binId, version);
    }

    getFilePath(localPath: string)
    {
        return this.fileStore.getStoreFilePath(localPath);
    }

    get appsPath() {
        return this.fileStore.getStoreFilePath("apps/");
    }

    routeWebDAV(route: string)
    {
        return webdav.extensions.express(route, this.webDAVServer)
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

    /**
     * Copies all assets in the source bin to the target bin.
     * @param sourceBin
     * @param targetBin
     */
    async copyBin(sourceBin: Bin, targetBin: Bin)
    {
        if (!sourceBin.assets) {
            throw new Error("missing assets array in source bin");
        }

        return Promise.all(sourceBin.assets.map(sourceAsset => {
            return Asset.create({
                filePath: sourceAsset.filePath,
                byteSize: sourceAsset.byteSize,
                binId: targetBin.id,
                bin: targetBin,
            })
            .then(targetAsset =>
                this.fileStore.copyFile(sourceAsset.getStoragePath(), targetAsset.getStoragePath())
            );
        }));
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

    async copyAsset(sourceAsset: Asset, targetFilePath: string, targetBin: Bin)
    {
        if (!sourceAsset.bin) {
            sourceAsset.bin = await sourceAsset.$get("bin") as Bin;
        }

        const targetAsset = await Asset.create({
            filePath: targetFilePath,
            binId: targetBin.id,
            byteSize: sourceAsset.byteSize,
        });

        targetAsset.bin = targetBin;

        return this.fileStore.copyFile(sourceAsset.getStoragePath(), targetAsset.getStoragePath());
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

    async writeFile(sourceFilePath: string, filePath: string, binId: number, overwrite?: boolean): Promise<Asset>
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
        const bin = await Bin.findByPk(binId, { include: [ Asset ]});

        let asset = bin.assets.find(asset => asset.filePath === filePath);

        if (!asset) {
            asset = await Asset.create({ filePath, binId: bin.id });
        }
        else if (asset && !overwrite) {
            throw new Error(`asset '${filePath}' already exists in bin`);
        }

        asset.bin = bin;
        const stream = await this.fileStore.createWriteStream(asset.getStoragePath());

        return { stream, asset };
    }
}