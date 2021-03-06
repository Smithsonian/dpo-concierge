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

import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, HasOne } from "sequelize-typescript";

import BinType from "./BinType";
import Asset from "./Asset";
import ItemBin from "./ItemBin";
import Item from "./Item";
import JobBin from "./JobBin";
import Job from "./Job";
import Scene from "./Scene";

////////////////////////////////////////////////////////////////////////////////

@Table({ indexes: [ { fields: ["uuid", "version"] } ] })
export default class Bin extends Model<Bin>
{
    static async createItemBin(item: Item, params: any)
    {
        return Bin.create(params)
            .then(bin => ItemBin.create({
                binId: bin.id,
                itemId: item.id,
            }).then(() => bin));
    }

    static async createJobBin(job: Job, params: any)
    {
        return Bin.create(params)
            .then(bin => JobBin.create({
                binId: bin.id,
                jobId: job.id,
            }).then(() => bin));
    }

    static async getLatestVersion(binUuid: string)
    {
        return Bin.findOne({
            where: { uuid: binUuid },
            order: [ [ "version", "DESC" ] ],
        });
    }

    static async getLatestVersionNumber(binUuid: string)
    {
        return Bin.findOne({
            where: { uuid: binUuid },
            order: [ [ "version", "DESC" ] ],
            attributes: [ "version" ]
        })
        .then(bin => bin ? bin.version : 0);
    }

    static async findByUuidAndVersion(uuid: string, version: number)
    {
        return Bin.findOne({
            where: { uuid, version }
        });
    }

    static async deleteBin(uuid: string)
    {
        let bin;

        return Bin.findOne({ where: { uuid }})
            .then(_bin => {
                bin = _bin;
                if (!bin) {
                    throw new Error(`bin not found: ${uuid}`);
                }
            })
            .then(() => Scene.destroy({ where: { binId: bin.id }}))
            .then(() => Asset.destroy({ where: { binId: bin.id }}))
            .then(() => Bin.destroy({ where: { id: bin.id }}));
    }

    ////////////////////////////////////////////////////////////////////////////////

    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, unique: "uuidVersion" })
    uuid: string;

    @Column({ type: DataType.INTEGER, defaultValue: 1, unique: "uuidVersion" })
    version: number;

    @Column({ type: DataType.STRING })
    name: string;

    @Column({ type: DataType.TEXT })
    description: string;

    @HasMany(() => Asset)
    assets: Asset[];

    @ForeignKey(() => BinType)
    @Column
    typeId: string;

    @BelongsTo(() => BinType)
    type: BinType;

    @HasOne(() => ItemBin)
    itemBin: ItemBin;

    @HasOne(() => JobBin)
    jobBin: JobBin;


    getStoragePathWithVersion() {
        return `bins/${this.uuid}/v${this.version}`;
    }
    getStoragePath() {
        return `bins/${this.uuid}`;
    }
}