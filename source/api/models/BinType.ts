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
export default class BinType extends Model<BinType>
{
    static readonly presets = {
        photogrammetry: "photogrammetry",
        master: "master",
        printable: "printable",
        editorial: "editorial",
        voyager: "voyager",
        web: "web",
        media: "media",
        processing: "processing",
    };

    @AfterSync
    static async populate()
    {
        const presets = BinType.presets;

        return BinType.count().then(count => {
            if (count === 0) {
                return BinType.bulkCreate([
                    { id: presets.photogrammetry, name: "Photogrammetry" },
                    { id: presets.master,         name: "Master" },
                    { id: presets.printable,      name: "Printable" },
                    { id: presets.editorial,      name: "Editorial" },
                    { id: presets.web,            name: "Web" },
                    { id: presets.media,          name: "Media" },
                    { id: presets.processing,     name: "Processing" },
                ]);
            }
        });
    }

    @Column({ primaryKey: true })
    id: string;

    @Column({ allowNull: false })
    name: string;
}