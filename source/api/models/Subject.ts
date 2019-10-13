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

import { Table, Column, Model, DataType } from "sequelize-typescript";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class Subject extends Model<Subject>
{
    static async findByNameOrCreate(values: any)
    {
        if (values.name) {
            return this.findOne({ where: { name: values.name }})
                .then(row => row ? row.update(values).then(() => row) : this.create(values));
        }

        return this.create(values);
    }

    @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, unique: true })
    uuid: string;

    @Column({ allowNull: false })
    name: string;

    @Column({ type: DataType.TEXT })
    description: string;

    @Column
    unitCode: string;

    @Column
    unitRecordId: string;

    @Column
    edanRecordId: string;

    @Column({ type: DataType.JSON })
    edanRecordCache: object;
}
