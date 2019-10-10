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

import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";

import Bin from "./Bin";

////////////////////////////////////////////////////////////////////////////////

@Table({ indexes: [ { fields: [ "filePath", "binId" ] }] })
export default class Asset extends Model<Asset>
{
    static async findAllWithBin()
    {
        return Asset.findAll({ include: [Bin] });
    }

    static async findVersion(binId: string, filePath: string, version: number): Promise<Asset | undefined>
    {
        // if version is unspecified, return latest version
        if (version === undefined) {
            const where = { binId, filePath };
            const order = [ "version", "DESC" ];
            return Asset.findOne({ where, order }).then(asset => {
                if (!asset) {
                    throw new Error(`asset not found: ${filePath} [latest]`);
                }

                return asset;
            })
        }

        // get and return specified version
        const where = { binId, filePath, version };
        return Asset.findOne({ where }).then(asset => {
            if (!asset) {
                throw new Error(`asset not found: ${filePath} [${version}]`);
            }

            return asset;
        })
    }

    static async getLatestVersionNumber(groupId: string, filePath: string): Promise<number | undefined>
    {
        const where = { groupId, filePath };
        const order = [ "version", "DESC" ];

        return Asset.findOne({ where, order, attributes: ["version"] })
            .then(asset => asset ? asset.version : 0);
    }

    @ForeignKey(() => Bin)
    @Column({ type: DataType.INTEGER, allowNull: false, unique: "pathBinId" })
    binId: string;

    @BelongsTo(() => Bin)
    bin: Bin;

    @Column({ type: DataType.STRING, allowNull: false, unique: "pathBinId" })
    filePath: string;

    @Column({ type: DataType.INTEGER })
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

    /**
     * Returns the path where the asset is stored in repository storage
     */
    getStoragePath() {
        // bin UUID / bin version / asset file path
        return `${this.bin.getStoragePath()}/${this.filePath}`;
    }
}