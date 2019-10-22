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

import * as mime from "mime";

import { Table, Column, Model, DataType, ForeignKey, BelongsTo, AfterSync } from "sequelize-typescript";

import Bin from "./Bin";

////////////////////////////////////////////////////////////////////////////////

@Table({ indexes: [ { fields: [ "filePath", "binId" ] }] })
export default class Asset extends Model<Asset>
{
    static async findByBinId(filePath: string, binId: number): Promise<Asset | undefined>
    {
        return Asset.findOne({
            where: { filePath, binId }
        })
        .then(asset => {
            if (!asset) {
                console.log(`[Asset.findByBinId] Asset not found in bin ${binId}: ${filePath}`);
            }

            return asset;
        });
    }

    static async findByBinVersion(filePath: string, binUuid: string, binVersion?: number): Promise<Asset | undefined>
    {
        let binIncludeOptions = binVersion ?
            { model: Bin, attributes: [ "id", "uuid", "version" ], where: { uuid: binUuid, version: binVersion } } :
            { model: Bin, attributes: [ "id", "uuid", "version" ], where: { uuid: binUuid }, order: [ "version", "DESC" ] };

        return Asset.findOne({
            where: { filePath },
            include: [ binIncludeOptions ],
        })
        .then(asset => {
            if (!asset) {
                console.log(`[Asset.findByBinVersion] Asset not found: ${binUuid}/${filePath}`);
            }

            return asset;
        });
    }

    ////////////////////////////////////////////////////////////////////////////////

    @ForeignKey(() => Bin)
    @Column({ type: DataType.INTEGER, allowNull: false, unique: "pathBinId" })
    binId: string;

    @BelongsTo(() => Bin)
    bin: Bin;

    @Column({ type: DataType.STRING, allowNull: false, unique: "pathBinId" })
    filePath: string;

    @Column({ type: DataType.INTEGER, defaultValue: 0 })
    byteSize: number;


    get path() {
        const lastSlash = this.filePath.lastIndexOf("/");
        return this.filePath.substr(0, lastSlash);
    }

    get name() {
        const lastSlash = this.filePath.lastIndexOf("/");
        return this.filePath.substr(lastSlash + 1);
    }

    get baseName() {
        const name = this.name;
        const lastDot = name.lastIndexOf(".");
        return name.substr(0, lastDot);
    }

    get extension() {
        const name = this.name;
        const lastDot = name.lastIndexOf(".");
        return name.substr(lastDot + 1);
    }

    get mimeType() {
        return mime.getType(this.filePath);
    }

    /**
     * Returns the path where the asset is stored in repository storage
     */
    getStoragePath()
    {
        // bin UUID / bin version / asset file path
        return `${this.bin.getStoragePath()}/${this.filePath}`;
    }
}