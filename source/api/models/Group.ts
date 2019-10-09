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

import Item from "./Item";
import GroupType from "./GroupType";
import Asset from "./Asset";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class Group extends Model<Group>
{
    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
    uuid: string;

    @Column({ type: DataType.STRING })
    name: string;

    @Column({ type: DataType.TEXT })
    description: string;

    @HasMany(() => Asset)
    assets: Asset[];

    @ForeignKey(() => GroupType)
    @Column
    typeId: string;

    @BelongsTo(() => GroupType)
    type: GroupType;

    @ForeignKey(() => Item)
    @Column
    itemId: number;

    @BelongsTo(() => Item)
    item: Item;
}