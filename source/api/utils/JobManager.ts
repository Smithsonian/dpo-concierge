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

import { Op, Model } from "sequelize";

import { Dictionary } from "./types";

import Job from "../models/Job";

import Services from "../app/Services";

////////////////////////////////////////////////////////////////////////////////

export default class JobManager
{
    protected static pollingInterval = 3000;

    protected static jobTypes = [
        "PlayMigrationJob"
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
            this.timerHandle = setInterval(() => this.run(), JobManager.pollingInterval);
        }
    }

    stop()
    {
        if (this.timerHandle) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
    }

    protected async run()
    {
        await this.fetchActiveJobs();
        await this.updateActiveJobs();
    }

    protected async fetchActiveJobs()
    {
        const tasks = JobManager.jobTypes.map(jobModelName => {
            const jobModel = Services.database.db.models[jobModelName];
            return jobModel.findAll({
                include: [{
                    model: Job,
                    where: {
                        state: { [Op.or]: ["created", "waiting", "running"] }
                    },
                }],
                logging: false, // logging disabled for this recurring task
            }).then(rows => {
                this.activeJobs[jobModelName] = rows;
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

    protected async updateActiveJob(job)
    {
        const state = job.job.state;

        switch (state) {
            case "created":
            case "started":
                console.log(`[JobManager] run job (${state}): ${job.job.name}`);
                return job.runJob();

            case "running":
            case "waiting":
                console.log(`[JobManager] update job (${state}): ${job.job.name}`);
                return job.updateJob();
        }

        return Promise.resolve();
    }
}