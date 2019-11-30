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

import * as fs from "fs";
import { WriteStream } from "fs";

import * as fetch from "node-fetch";
import * as mkdirp from "mkdirp";

import * as JSONValidator from "ajv";
import { Ajv } from "ajv";

import { IJobOrder, IRecipe, IParameters, IJobInfo, IJobReport, TTaskState } from "./cookTypes";

////////////////////////////////////////////////////////////////////////////////

export { IParameters };

export default class CookClient
{
    readonly machineAddress: string;
    readonly clientId: string;

    protected jsonValidator: Ajv;

    constructor(machineAddress: string, clientId: string)
    {
        if (!machineAddress || !clientId) {
            throw new Error("CookClient.constructor - missing machine address and/or client id");
        }

        this.machineAddress = machineAddress;
        this.clientId = clientId;

        this.jsonValidator = new JSONValidator({ allErrors: true, verbose: true });
        this.jsonValidator.addFormat("file", value => true);
    }

    async uploadFiles(jobId: string, filePaths: string[])
    {
        return Promise.all(filePaths.map(path => this.uploadFile(jobId, path)));
    }

    async uploadFile(jobId: string, filePath: string): Promise<void>
    {
        if (!fs.existsSync(filePath)) {
            console.log(`[CookClient] skipping upload, file not existing: ${filePath}`);
            return Promise.resolve();
        }

        const stream = fs.createReadStream(filePath);

        const targetPath = filePath.startsWith("/") ? filePath.split("/").pop() : filePath;
        const endpoint = this.machineAddress + "/" + jobId + "/" + targetPath;

        console.log(`[CookClient] uploading: '${filePath}' to job '${jobId}'`);

        return fetch(endpoint, {
            method: "PUT",
            body: stream
        });
    }

    async downloadFiles(jobId: string, filePaths: string[])
    {
        return Promise.all(filePaths.map(path => this.downloadFile(jobId, path)));
    }

    async downloadFile(jobId: string, filePath: string, writeStream?: WriteStream)
    {
        const endpoint = this.machineAddress + "/" + jobId + "/" + filePath;

        console.log(`[CookClient] downloading: '${filePath}' from job '${jobId}'`);

        // ensure target folder exists
        const parts = filePath.split("/");
        parts.pop();
        const basePath = parts.join("/");

        if (basePath) {
            mkdirp(basePath);
        }

        return fetch(endpoint).then(result => new Promise((resolve, reject) => {
            const stream = writeStream || fs.createWriteStream(filePath);
            result.body.on("end", resolve);
            result.body.on("error", error => reject(error));
            result.body.pipe(stream);
        }));
    }

    async waitForState(jobId: string, state: TTaskState, timeoutMilliseconds: number): Promise<void>
    {
        return new Promise((resolve, reject) => {
            const timeoutHandler = setTimeout(() => {
                clearInterval(intervalHandler);
                reject(new Error("timeout while waiting for job status"));
            }, timeoutMilliseconds);

            const intervalHandler = setInterval(() => {
                this.jobInfo(jobId).then(info => {
                    if (info.state === state) {
                        clearInterval(intervalHandler);
                        clearTimeout(timeoutHandler);
                        resolve();
                    }
                }).catch(() => {});
            }, 1000);
        });
    }

    async createJob(jobId: string, recipeId: string, parameters: IParameters): Promise<unknown>
    {
        return this.getRecipe(recipeId)
        .then(recipe => {
            this.validateParameters(recipe, parameters);

            const order: IJobOrder = {
                id: jobId,
                name: "cli",
                clientId: this.clientId,
                recipeId,
                parameters,
                priority: "normal",
                submission: new Date().toISOString()
            };

            return this.fetchJson(this.machineAddress + "/job", "POST", order);
        });
    }

    async runJob(jobId: string): Promise<unknown>
    {
        return this.fetchJson(this.clientPath + "/jobs/" + jobId + "/run", "PATCH");
    }

    async cancelJob(jobId: string): Promise<unknown>
    {
        return this.fetchJson(this.clientPath + "/jobs/" + jobId + "/cancel", "PATCH");
    }

    async deleteJob(jobId: string): Promise<unknown>
    {
        return this.fetchJson(this.clientPath + "/jobs/" + jobId, "DELETE");
    }

    async jobInfo(jobId: string): Promise<IJobInfo>
    {
        return this.fetchJson(this.clientPath + "/jobs/" + jobId, "GET");
    }

    async jobReport(jobId: string): Promise<IJobReport>
    {
        return this.fetchJson(this.clientPath + "/jobs/" + jobId + "/report", "GET");
    }

    async listJobs(): Promise<void>
    {
        return this.fetchJson(this.clientPath + "/jobs", "GET");
    }

    async listRecipes(): Promise<void>
    {
        return this.fetchJson(this.machineAddress + "/recipes", "GET");
    }

    async getRecipe(recipeId: string): Promise<IRecipe>
    {
        return this.fetchJson(this.machineAddress + "/recipes/" + recipeId, "GET");
    }

    async machineInfo(): Promise<void>
    {
        return this.fetchJson(this.machineAddress + "/machine", "GET");
    }

    protected get clientPath() {
        return this.machineAddress + "/clients/" + this.clientId;
    }

    protected validateParameters(recipe: IRecipe, parameters: IParameters)
    {
        if (!this.jsonValidator.validate(recipe.parameterSchema, parameters)) {
            throw new Error(
                "invalid parameters; " +
                this.jsonValidator.errorsText(null, { separator: ", ", dataVar: "parameters" })
            );
        }
    }

    protected extractFiles(recipe: IRecipe, parameters: IParameters): string[]
    {
        const files = [];

        for (const key in parameters) {
            const schema = recipe.parameterSchema.properties[key];
            if (schema.format && schema.format === "file") {
                files.push(parameters[key]);
            }
        }

        return files;
    }

    protected async fetchJson(endpoint: string, method: string, data?: any): Promise<any>
    {
        const body = data ? JSON.stringify(data) : undefined;

        return fetch(endpoint, {
            method,
            body,
            headers: { "Content-Type": "application/json" },
            timeout: 2000,
        })
        .then(result => {
            if (result.ok) {
                return result.json();
            }

            throw new Error(`HTTP error ${result.status}: ${result.statusText}`);
        });
    }
}
