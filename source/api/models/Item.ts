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

import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BelongsToMany } from "sequelize-typescript";

import Subject from "./Subject";
import Bin from "./Bin";
import ItemBin from "./ItemBin";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class Item extends Model<Item>
{
    static async findBins(includeAssets: boolean)
    {
        //return Bin.findAll({ where: { }})
        return Promise.reject(new Error("not implemented yet"));
    }

    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, unique: true })
    uuid: string;

    @Column({ type: DataType.STRING })
    name: string;

    @Column({ type: DataType.TEXT })
    description: string;

    @ForeignKey(() => Subject)
    @Column
    subjectId: number;

    @BelongsTo(() => Subject)
    subject: Subject;

    @BelongsToMany(() => Bin, () => ItemBin, "itemId", "binId")
    bins: Bin[];
}
