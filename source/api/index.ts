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

import * as sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import * as path from "path";
import { Container } from "typedi";
import { PubSub } from "graphql-subscriptions";

import Server, { IServerConfiguration } from "./app/Server";
import Database, { IDatabaseConfiguration } from "./app/Database";

import ManagedRepository, { IAPISettings } from "./utils/ManagedRepository";
import LocalFileStore from "./utils/LocalFileStore";
import CookClient from "./utils/CookClient";
import EDANClient from "./utils/EDANClient";

////////////////////////////////////////////////////////////////////////////////
// ENVIRONMENT VARIABLES

const getEnvVariable = function(name: string, nothrow: boolean = false)
{
    const value = process.env[name];
    if (!value) {
        console.warn(`[Server] WARNING: environment variable not set: ${name}`);
        if (!nothrow) {
            throw new Error(`environment variable not set: ${name}`);
        }
    }

    return value;
};

const isDevMode = getEnvVariable("NODE_ENV") !== "production";

const mySQLHost = getEnvVariable("MYSQL_HOST");
const mySQLDatabase = getEnvVariable("MYSQL_DATABASE");
const mySQLUser = getEnvVariable("MYSQL_USER");
const mySQLPassword = getEnvVariable("MYSQL_PASSWORD");

const fileStorePath = getEnvVariable("FILE_STORE_BASEPATH");
const uploadPath = getEnvVariable("API_UPLOAD_BASEPATH");
const uploadUrl = getEnvVariable("API_UPLOAD_URL");
const upsertEndpoint = getEnvVariable("API_UPSERT_ENDPOINT");

const cookMachineAddress = getEnvVariable("COOK_MACHINE_ADDRESS");
const cookClientId = getEnvVariable("COOK_CLIENT_ID");

const edanAppId = getEnvVariable("EDAN_APP_ID");
const edanAppKey = getEnvVariable("EDAN_APP_KEY");

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const rootDir = path.resolve(__dirname, "../../..");

const serverConfig: IServerConfiguration = {
    port: 8000,
    staticDir: path.resolve(rootDir, "dist/"),
    isDevMode,
};

const databaseConfig: IDatabaseConfiguration = {
    host: mySQLHost,
    database: mySQLDatabase,
    password: mySQLPassword,
    user: mySQLUser,
    loggingEnabled: isDevMode,
};

////////////////////////////////////////////////////////////////////////////////
// GREETING

console.log(`
  _________       .__  __  .__                        .__                ________ ________   
 /   _____/ _____ |__|/  |_|  |__   __________   ____ |__|____    ____   \\_____  \\\\______ \\  
 \\_____  \\ /     \\|  \\   __\\  |  \\ /  ___/  _ \\ /    \\|  \\__  \\  /    \\    _(__  < |    |  \\ 
 /        \\  Y Y  \\  ||  | |   Y  \\\\___ (  <_> )   |  \\  |/ __ \\|   |  \\  /       \\|    \`   \\
/_______  /__|_|  /__||__| |___|  /____  >____/|___|  /__(____  /___|  / /______  /_______  /
        \\/      \\/              \\/     \\/           \\/        \\/     \\/         \\/        \\/ 

--------------------------------------------------------------------
Smithsonian 3D Foundation Project - Concierge Migration Workflow API
--------------------------------------------------------------------
Port:                    ${serverConfig.port}
Development Mode:        ${serverConfig.isDevMode}
Static File Directory:   ${serverConfig.staticDir}
Cook Server:             ${process.env["COOK_MACHINE_ADDRESS"]}
--------------------------------------------------------------------
`);

////////////////////////////////////////////////////////////////////////////////
// INIT SERVICES AND START

const apiSettings: IAPISettings = {
    uploadPath,
    uploadUrl,
    endpoints: {
        upsert: upsertEndpoint
    }
};

const server = new Server(serverConfig);
const database = new Database(databaseConfig);
const pubSub = new PubSub();
const repo = new ManagedRepository(new LocalFileStore(fileStorePath), apiSettings);

Container.set(Server, server);
Container.set(Database, database);
Container.set(ManagedRepository, repo);
Container.set(CookClient, new CookClient(cookMachineAddress, cookClientId));
Container.set(EDANClient, new EDANClient(edanAppId, edanAppKey));
Container.set(PubSub, pubSub);

database.setup()
.then(() => server.setup())
.then(() => server.start());
