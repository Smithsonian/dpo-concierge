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

import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";

import BinType from "./BinType";
import Asset from "./Asset";

////////////////////////////////////////////////////////////////////////////////

@Table({ indexes: [ { fields: ["uuid", "version"] } ] })
export default class Bin extends Model<Bin>
{
    static async findOneWithAssets(options)
    {
        return this.findOne({ ...options, include: [Asset] });
    }

    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, unique: "uuidVersion" })
    uuid: string;

    @Column({ type: DataType.INTEGER, unique: "uuidVersion" })
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

    getStoragePath() {
        return `${this.uuid}/v${this.version}`;
    }
}