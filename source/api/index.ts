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

import ManagedRepository from "./utils/ManagedRepository";
import LocalFileStore from "./utils/LocalFileStore";
import CookClient from "./utils/CookClient";
import EDANClient from "./utils/EDANClient";

////////////////////////////////////////////////////////////////////////////////
// ENVIRONMENT VARIABLES

const isDevMode = process.env["NODE_ENV"] !== "production";

const mySQLPassword = process.env["MYSQL_PASSWORD"];

const fileStorePath = process.env["FILE_STORE_BASEPATH"];

const cookMachineAddress = process.env["COOK_MACHINE_ADDRESS"];
const cookClientId = process.env["COOK_CLIENT_ID"];

const edanAppId = process.env["EDAN_APP_ID"];
const edanAppKey = process.env["EDAN_APP_KEY"];

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const rootDir = path.resolve(__dirname, "../../..");

const serverConfig: IServerConfiguration = {
    port: 8000,
    staticDir: path.resolve(rootDir, "dist/"),
    isDevMode,
};

const databaseConfig: IDatabaseConfiguration = {
    host: "db",
    database: "concierge",
    password: mySQLPassword,
    user: "concierge",
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

const server = new Server(serverConfig);
const database = new Database(databaseConfig);
const pubSub = new PubSub();

// setInterval(() => {
//     console.log("[index] interval publish");
//     pubSub.publish("JOB_STATE", { ok: true, message: "interval!" });
// }, 5000);
//
// pubSub.subscribe("JOB_STATE", m => { console.log("[index] message received: ", m)})

Container.set(Server, server);
Container.set(Database, database);
Container.set(ManagedRepository, new ManagedRepository(new LocalFileStore(fileStorePath)));
Container.set(CookClient, new CookClient(cookMachineAddress, cookClientId));
Container.set(EDANClient, new EDANClient(edanAppId, edanAppKey));
Container.set(PubSub, pubSub);

database.setup()
.then(() => server.setup())
.then(() => server.start());


