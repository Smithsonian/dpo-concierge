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

import { Model } from "sequelize-typescript"

import { Dictionary } from "../utils/types";

import Job from "../models/Job";

import PlayMigrationJob from "../models/PlayMigrationJob";
import { Op } from "sequelize";

////////////////////////////////////////////////////////////////////////////////

export default class JobManager
{
    protected static jobTypes = [
        PlayMigrationJob
    ];

    protected activeJobs: Dictionary<Model[]>;
    protected timerHandle;

    constructor()
    {
        this.activeJobs = {};
        this.timerHandle = null;
    }

    start()
    {
        if (!this.timerHandle) {
            this.timerHandle = setInterval(() => this.run(), 2000);
        }
    }

    stop()
    {
        if (this.timerHandle) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
    }

    async run()
    {
        await this.fetchActiveJobs();
        await this.updateActiveJobs();
    }

    protected async fetchActiveJobs()
    {
        const tasks = JobManager.jobTypes.map(jobType => {
            const typeName = jobType.typeName;
            return jobType.findAll({
                include: [{
                    model: Job,
                    where: {
                        state: { [Op.or]: ["created", "waiting", "running"] }
                    },
                }]
            }).then(rows => {
                this.activeJobs[typeName] = rows;
            });
        });

        return Promise.all(tasks);
    }

    protected async updateActiveJobs()
    {
        const tasks = Object.keys(this.activeJobs).map(typeKey => {
            const tasks = this.activeJobs[typeKey].map((job: any) => {
                return this.updateActiveJob(job);
            });

            return Promise.all(tasks);
        });

        return Promise.all(tasks);
    }

    protected async updateActiveJob(job: PlayMigrationJob)
    {
        const state = job.job.state;

        switch (state) {
            case "created":
                return job.runJob();

            case "running":
            case "waiting":
                return job.updateJob();
        }

        return Promise.resolve();
    }
}