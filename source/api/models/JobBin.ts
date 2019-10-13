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

import { Table, Column, Model, ForeignKey, BelongsTo } from "sequelize-typescript";

import Job from "./Job";
import Bin from "./Bin";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class JobBin extends Model<JobBin>
{
    @ForeignKey(() => Bin)
    @Column({ unique: true })
    binId: number;

    @BelongsTo(() => Bin)
    bin: Bin;

    @ForeignKey(() => Job)
    @Column
    jobId: number;

    @BelongsTo(() => Job)
    job: Job;
}