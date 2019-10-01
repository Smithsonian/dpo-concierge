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

////////////////////////////////////////////////////////////////////////////////

const data = [
    { id: "voyagerDocument", name: "Voyager Scene Document" },
    { id: "voyagerArticlePage", name: "Voyager Article Page" },
    { id: "voyagerArticleMedia", name: "Voyager Article Media" },
    { id: "voyagerModelAsset", name: "Voyager Model Asset" },
    { id: "voyagerPreview", name: "Voyager Preview Image" },
];

////////////////////////////////////////////////////////////////////////////////

@Table
export default class AssetType extends Model<AssetType>
{
    static async populate()
    {
        return this.bulkCreate(data);
    }

    @Column({ type: DataType.STRING, primaryKey: true })
    id: string;

    @Column({ type: DataType.STRING, allowNull: false })
    name: string;
}