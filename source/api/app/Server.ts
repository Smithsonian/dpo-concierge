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

import * as express from "express";
import * as session from "express-session";
import * as memorystore from "memorystore";
import * as http from "http";
import * as morgan from "morgan";

import * as passport from "passport";
import * as LocalStrategy from "passport-local";
import * as LdapStrategy from "passport-ldapauth";

import * as graphqlHttp from "express-graphql";
import { buildSchema } from "type-graphql";

import MigrationEntryResolver from "../resolvers/MigrationEntryResolver";
import ItemResolver from "../resolvers/ItemResolver";

import User from "../models/User";

////////////////////////////////////////////////////////////////////////////////

export interface IServerConfiguration
{
    port: number;
    staticDir: string;
    isDevMode: boolean;
}

export default class Server
{
    private _config: IServerConfiguration;
    private _app: express.Express;
    private _server: http.Server;

    get app() {
        return this._app;
    }
    get config(): Readonly<IServerConfiguration> {
        return this._config;
    }
    get isDevMode() {
        return this._config.isDevMode;
    }

    constructor(config: IServerConfiguration)
    {
        this._config = Object.assign({}, config);

        this._app = express();
        this._app.disable('x-powered-by');
        this._app.set("trust proxy", 1);
    }

    async setup()
    {
        const app = this.app;

        // logging in dev mode
        if (this.isDevMode) {
            this.app.use(morgan("tiny"))
        }

        // session memory store
        const MemoryStore = memorystore(session);
        app.use(session({
            store: new MemoryStore({ checkPeriod: 86400000 /* 24 hours */ }),
            secret: "234f234fj2o3i4fjo23jf",
            resave: false,
            saveUninitialized: true,
        }));

        const localStrategy = new LocalStrategy((username, password, done) => {
            User.findOne({ where: { name: username }}).then(user => {
                if (!user) {
                    return done(null, false, { message: "Incorrect username" });
                }

                user.isValidPassword(password).then(result => {
                    if (result) {
                        done(null, user);
                    }
                    else {
                        return done(null, false, { message: "Incorrect password" });
                    }
                });
            }).catch(err => {
                return done(err);
            });
        });

        // const ldapStrategy = new LdapStrategy((username, password, done) => {
        //
        // });

        // authentication
        passport.serializeUser((user: User, done) => {
            done(null, user.id);
        });

        passport.deserializeUser((id: string, done) => {
            User.findByPk(id).then(user => {
                done(null, user);
            }).catch(err => {
                done(err, null);
            });
        });

        passport.use(localStrategy);
        // passport.use(ldapStrategy);

        app.use(passport.initialize());
        app.use(passport.session());

        // GraphQL endpoint
        const schema = await buildSchema({ resolvers: [
            MigrationEntryResolver,
            ItemResolver
        ]});

        app.use("/graphql", graphqlHttp({ schema: schema, graphiql: true }));

        // Web application
        app.get("/", (req, res, next) => {
            res.sendFile(this.config.staticDir + "/concierge-dev.html", err => {
                if (err) {
                    next(err);
                }
            });
        });

        app.use("/", express.static(this.config.staticDir));

        // error handling
        app.use((error, req, res, next) => {
            console.error(error);

            if (res.headersSent) {
                return next(error);
            }

            if (req.accepts("json")) {
                // send JSON formatted error
                res.status(500).send({ error: `${error.name}: ${error.message}` });
            }
            else {
                // send generic error page
                res.status(500).render("errors/500", { error });
            }
        });
    }

    async start()
    {
        this._server = new http.Server(this.app);
        await this._server.listen(this.config.port);
        console.info(`\n\nServer ready and listening on port ${this.config.port}\n`);
    }
}