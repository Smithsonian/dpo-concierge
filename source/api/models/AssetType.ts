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

import { Table, Column, Model, AfterSync } from "sequelize-typescript";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class AssetType extends Model<AssetType>
{
    static readonly presets = {
        voyagerDocument: "voyagerDocument",
    };

    @AfterSync
    static async populate()
    {
        const presets = AssetType.presets;

        return AssetType.count().then((count => {
            if (count === 0) {
                return AssetType.bulkCreate([
                    { id: presets.voyagerDocument, name: "Voyager Scene Document" },
                ]);
            }
        }));
    }

    @Column({ primaryKey: true })
    id: string;

    @Column({ allowNull: false })
    name: string;
}