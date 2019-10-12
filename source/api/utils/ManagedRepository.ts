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
import Bin from "../models/Bin";

import { IFileStore, ReadStream } from "./FileStore";

////////////////////////////////////////////////////////////////////////////////

export default class ManagedRepository
{
    protected readonly fileStore: IFileStore;

    constructor(fileStore: IFileStore)
    {
        this.fileStore = fileStore;
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

    async createWriteStream(filePath: string, binId: number, overwrite?: boolean)
    {
        let bin: Bin = undefined;

        return Bin.findByPk(binId)
        .then(_bin => {
            bin = _bin;
            return Asset.create({
                filePath,
                binId: bin.id
            });
        })
        .then(asset => {
            asset.bin = bin;
            return this.fileStore.createWriteStream(asset.getStoragePath());
        });
    }
}