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

import * as path from "path";

import { Sequelize } from "sequelize-typescript";

import Role from "../models/Role";

////////////////////////////////////////////////////////////////////////////////

export interface IDatabaseConfiguration
{
    host: string;
    database: string;
    user: string;
    password: string;
    loggingEnabled: boolean;
}

export default class Database
{
    private _config: IDatabaseConfiguration;
    private _db: Sequelize;

    get db() {
        return this._db;
    }
    get config(): Readonly<IDatabaseConfiguration> {
        return this._config;
    }

    constructor(config: IDatabaseConfiguration)
    {
        this._config = Object.assign({}, config);

        const connectionString = `mariadb://${config.user}:${config.password}@${config.host}/${config.database}`;

        const modelPath = path.resolve(__dirname, "../models");
        console.log(`Database Model Path: ${modelPath}`);
        this._db = new Sequelize(connectionString, {
            modelPaths: [ modelPath ],
            define: {
                charset: 'utf8',
                collate: 'utf8_general_ci',
                timestamps: true
            },
            logging: config.loggingEnabled,
        });
    }

    async setup()
    {
        return this.db.sync()
            .then(() => Role.populateDefaultPermissions());
    }
}