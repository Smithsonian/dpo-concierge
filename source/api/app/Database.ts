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

import { Sequelize } from "sequelize-typescript";

import SI_Unit from "../models/SI_Unit";

////////////////////////////////////////////////////////////////////////////////

export interface IDatabaseConfiguration
{
    host: string;
    database: string;
    user: string;
    password: string;
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

        const modelPath = __dirname + "/../models";
        console.log(modelPath);
        this._db = new Sequelize(connectionString, { modelPaths: [ modelPath ]});
    }

    async setup()
    {
        await this._db.sync();
        await SI_Unit.populate();
    }
}