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

import Database, { IDatabaseConfiguration } from "./Database";
import ManagedRepository from "../utils/ManagedRepository";
import LocalFileStore from "../utils/LocalFileStore";
import JobManager from "../utils/JobManager";
import CookClient from "../utils/CookClient";
import EDANClient from "../utils/EDANClient";

////////////////////////////////////////////////////////////////////////////////
// ENVIRONMENT VARIABLES

const isDevMode = process.env["NODE_ENV"] !== "production";

const mySQLPassword = process.env["MYSQL_PASSWORD"];

const fileStoragePath = process.env["FILE_STORAGE_BASEPATH"];

const cookMachineAddress = process.env["COOK_MACHINE_ADDRESS"];
const cookClientId = process.env["COOK_CLIENT_ID"];

const edanAppId = process.env["EDAN_APP_ID"];
const edanAppKey = process.env["EDAN_APP_KEY"];

////////////////////////////////////////////////////////////////////////////////

const databaseConfig: IDatabaseConfiguration = {
    host: "db",
    database: "concierge",
    password: mySQLPassword,
    user: "concierge",
    loggingEnabled: isDevMode,
};

export const database = new Database(databaseConfig);
export const repository = new ManagedRepository(new LocalFileStore(fileStoragePath));
export const jobManager = new JobManager();
export const cookClient = new CookClient(cookMachineAddress, cookClientId);
export const edanClient = new EDANClient(edanAppId, edanAppKey);

export default {
    database,
    repository,
    jobManager,
    cookClient,
    edanClient,
};

