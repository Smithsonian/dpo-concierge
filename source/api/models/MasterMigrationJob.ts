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

import Job, { IJobImplementation } from "./Job";
import Scene from "./Scene";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class MasterMigrationJob extends Model<MasterMigrationJob> implements IJobImplementation
{
    static readonly typeName: string = "MasterMigrationJob";
    protected static cookPollingInterval = 3000;

    ////////////////////////////////////////////////////////////////////////////////
    // SCHEMA

    // the base job
    @ForeignKey(() => Job)
    @Column
    jobId: number;

    @BelongsTo(() => Job)
    job: Job;

    // the migrated Voyager scene and bin
    @ForeignKey(() => Scene)
    @Column
    sourceSceneId: number;

    @BelongsTo(() => Scene)
    sourceScene: Scene;

    @ForeignKey(() => Scene)
    targetSceneId: number;

    @BelongsTo(() => Scene)
    targetScene: Scene;

    @Column
    cookThumbJobId: string;

    @Column
    cookMultiJobId: string;

    @Column
    masterModelGeometry: string;

    @Column
    masterModelTexture: string;

    ////////////////////////////////////////////////////////////////////////////////

    async run(job: Job)
    {
        // 1. copy all assets from source bin to target bin, including voyager document
        // 2. fetch geometry/texture from shared drive
        // 3. create web-thumb job, run
        // 4.
    }

    async cancel(job: Job)
    {

    }

    async delete(job: Job)
    {

    }
}