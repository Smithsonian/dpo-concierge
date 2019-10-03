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
import Server, { IServerConfiguration } from "./app/Server";
import Database, { IDatabaseConfiguration } from "./app/Database";

import MigrationSheet from "./utils/MigrationSheet";
import MigrationEntry from "./models/MigrationEntry";
import EDANClient from "./utils/EDANClient";

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const rootDir = path.resolve(__dirname, "../../..");


const serverConfig: IServerConfiguration = {
    port: 8000,
    staticDir: path.resolve(rootDir, "dist/"),
    isDevMode: process.env["NODE_ENV"] !== "production",
};

const databaseConfig: IDatabaseConfiguration = {
    host: "db",
    database: "concierge",
    password: process.env["MYSQL_PASSWORD"],
    user: "concierge",
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
--------------------------------------------------------------------
`);

////////////////////////////////////////////////////////////////////////////////
// INIT AND START

const server = new Server(serverConfig);
const database = new Database(databaseConfig);

const edanAppId = process.env["EDAN_APP_ID"];
const edanAppKey = process.env["EDAN_APP_KEY"];

database.setup()
.then(() => server.setup())
.then(() => server.start())
.then(() => {
    //const migration = new MigrationSheet();
    //migration.update()
    //.then(() => MigrationEntry.importSheet(migration))
    //.then(() => console.log("SHEET IMPORT DONE."));

    //const edanClient = new EDANClient(edanAppId, edanAppKey);
    //edanClient.fetchMdmRecord("edanmdm-nmnhpaleobiology_3446197");
});

