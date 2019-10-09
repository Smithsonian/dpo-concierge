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

import Group from "./Group";

////////////////////////////////////////////////////////////////////////////////

@Table({ indexes: [ { fields: ["pathName", "version"] }] })
export default class Asset extends Model<Asset>
{
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    uuid: string;

    @Column({ type: DataType.INTEGER, allowNull: false, unique: "pathVersion" })
    version: number;

    @Column({ type: DataType.STRING, allowNull: false, unique: "pathVersion" })
    pathName: string;

    @Column({ allowNull: false })
    path: string;

    @Column({ allowNull: false })
    name: string;

    @Column({ allowNull: false })
    extension: string;

    @Column({ type: DataType.INTEGER })
    byteSize: number;

    @ForeignKey(() => Group)
    @Column({ type: DataType.UUID })
    groupId: string;

    @BelongsTo(() => Group)
    group: Group;

    getFilePath()
    {
        // Asset UUID / Asset Version / Asset Name.Extension
        return `${this.uuid}/${this.version}/${this.name}.${this.extension}`;
    }
}