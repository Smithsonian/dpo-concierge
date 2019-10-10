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

import { Table, Column, Model, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import * as bcrypt from "bcrypt";

import Project from "./Project";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class User extends Model<User>
{
    @Column
    name: string;

    @Column
    email: string;

    @Column
    password: string;

    @ForeignKey(() => Project)
    @Column
    activeProjectId: number;

    @BelongsTo(() => Project, { constraints: false })
    activeProject: Project;

    @HasMany(() => Project)
    projects: Project[];

    static async getPasswordHash(password: string): Promise<string>
    {
        return await bcrypt.hash(password, 10);
    }

    async isValidPassword(password: string): Promise<boolean>
    {
        return await bcrypt.compare(password, this.password);
    }
}