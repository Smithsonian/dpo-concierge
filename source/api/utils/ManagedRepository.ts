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

import Asset from "../models/Asset";

import { IFileStore } from "./FileStore";

////////////////////////////////////////////////////////////////////////////////

export default class ManagedRepository
{
    protected readonly fileStore: IFileStore;

    constructor(fileStore: IFileStore)
    {
        this.fileStore = fileStore;
    }

    async readFile(targetFilePath: string, groupId: string, filePath: string, version?: number)
    {
        return Asset.findVersion(groupId, filePath, version)
            .then(asset => this.fileStore.readFile(asset.getStoragePath(), targetFilePath));
    }

    async createReadStream(groupId: string, filePath: string, version?: number)
    {
        return Asset.findVersion(groupId, filePath, version)
            .then(asset => this.fileStore.createReadStream(asset.getStoragePath()));
    }

    async writeFile(sourceFilePath: string, groupId: string, filePath: string, overwrite?: boolean)
    {
        let asset: Asset = undefined;
        let storageFilePath: string = undefined;

        return Asset.getLatestVersionNumber(groupId, filePath)
            .then(latestVersion => Asset.create({
                filePath,
                groupId,
                version: overwrite ? latestVersion : latestVersion + 1
            }))
            .then(_asset => {
                asset = _asset;
                storageFilePath = asset.getStoragePath();
                return this.fileStore.writeFile(sourceFilePath, storageFilePath);
            })
            .then(() => this.fileStore.getFileInfo(storageFilePath))
            .then(stats => {
                asset.byteSize = stats.byteSize;
                return asset.save();
            })
            .catch(error => {
                if (asset) {
                    asset.destroy().then(() => { throw error; });
                }
            });
    }

    async createWriteStream(groupId: string, filePath: string, overwrite?: boolean)
    {
        return Asset.getLatestVersionNumber(groupId, filePath)
        .then(latestVersion => Asset.create({
            filePath,
            groupId,
            version: overwrite ? latestVersion : latestVersion + 1
        }))
        .then(asset => this.fileStore.createWriteStream(asset.getStoragePath()));
    }
}