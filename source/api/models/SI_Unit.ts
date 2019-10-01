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

const data = [
    { isni: '0000000105178260', name: 'Anacostia Community Museum'},
    { isni: '0000000106502747', name: 'Smithsonian Institution - Dept. of Botany'},
    { isni: '0000000106516057', name: 'National Museum of Natural History (U.S.) Vertebrate Zoology'},
    { isni: '0000000106710255', name: 'Smithsonian/Folkways Recordings'},
    { isni: '0000000110911367', name: 'Smithsonian Institution Archives'},
    { isni: '0000000120343957', name: 'Smithsonian Institution Libraries'},
    { isni: '0000000121693449', name: 'National Museum of the American Indian (U.S.)'},
    { isni: '0000000121822028', name: 'National Zoological Park'},
    { isni: '0000000122858065', name: 'National Air and Space Museum'},
    { isni: '0000000122926486', name: 'Smithsonian Center for Folklife and Cultural Heritage'},
    { isni: '0000000122951833', name: 'National Museum of African Art'},
    { isni: '0000000122969689', name: 'Smithsonian Tropical Research Institute'},
];

////////////////////////////////////////////////////////////////////////////////

@Table
export default class SI_Unit extends Model<SI_Unit>
{
    static async populate()
    {
        return this.bulkCreate(data);
    }

    @Column({ type: DataType.STRING, primaryKey: true })
    isni: string;

    @Column({ type: DataType.STRING })
    name: string;
}