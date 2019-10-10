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
import * as bodyParser from "body-parser";
import * as colors from "colors/safe";

import * as passport from "passport";
import * as LocalStrategy from "passport-local";
import * as LdapStrategy from "passport-ldapauth";

import * as graphqlHttp from "express-graphql";
import { buildSchema } from "type-graphql";
import { Container } from "typedi";

import SubjectResolver from "../resolvers/SubjectResolver";
import ItemResolver from "../resolvers/ItemResolver";
import BinResolver from "../resolvers/BinResolver";
import AssetResolver from "../resolvers/AssetResolver";

import UserResolver from "../resolvers/UserResolver";
import ProjectResolver from "../resolvers/ProjectResolver";
import JobResolver from "../resolvers/JobResolver";
import PlayMigrationJobResolver from "../resolvers/PlayMigrationJobResolver";
import MigrationSheetEntryResolver from "../resolvers/MigrationSheetEntryResolver";

import User from "../models/User";
import Project from "../models/Project";

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

        const localStrategy = new LocalStrategy({
            usernameField: "email",
            passwordField: "password",
        },(email, password, done) => {
            User.findOne({ where: { email }}).then(user => {
                if (!user) {
                    console.log(`LocalStrategy - user email not found: ${email}`);
                    return done(null, false, { message: "Incorrect username" });
                }

                user.isValidPassword(password).then(result => {
                    if (result) {
                        console.log(`LocalStrategy - authenticated user: ${email}`);
                        return done(null, user);
                    }
                    else {
                        console.log(`LocalStrategy - password mismatch for user: ${email}`);
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
            User.findByPk(id, { include: [ { model: Project, as: "activeProject" } ] }).then(user => {
                done(null, user);
            }).catch(err => {
                done(err, null);
            });
        });

        passport.use(localStrategy);
        // passport.use(ldapStrategy);

        app.use(bodyParser.json());
        app.use(passport.initialize());
        app.use(passport.session());

        // GraphQL endpoint
        const schema = await buildSchema({
            resolvers: [
                SubjectResolver,
                ItemResolver,
                BinResolver,
                AssetResolver,
                UserResolver,
                ProjectResolver,
                JobResolver,
                PlayMigrationJobResolver,
                MigrationSheetEntryResolver,
            ],
            authChecker: ({ root, args, context, info }, roles) => {
                return true;
            },
            container: Container,
        });

        // static file server
        app.use("/static", express.static(this.config.staticDir));

        // sign in/sign up page
        app.get(["/login", "/register"], (req, res, next) => {
            res.sendFile(`${this.config.staticDir}/auth-dev.html`, err => {
                if (err) {
                    next(err);
                }
            });
        });

        app.post("/login", passport.authenticate("local"), (req, res) => {
            res.json({ status: "ok" });
        });

        // TODO: Must be authorized
        app.use("/graphql", graphqlHttp(async (req, res, graphQLParams) => {

            return {
                schema: schema,
                graphiql: this.isDevMode,
                customFormatErrorFn: this.isDevMode ? error => {
                    console.log(colors.red("GRAPHQL ERROR"));
                    console.log(error.message);
                    return {
                        message: error.message,
                        locations: error.locations,
                        stack: error.stack ? error.stack.split('\n') : [],
                        path: error.path,
                    };
                } : null,
            };
        }));

        ////////////////////////////////////////////////////////////////////////////////
        // AUTHENTICATED USERS ONLY

        app.use((req, res, next) => {
            //if (!req.user) {
            //    // TODO: Temp auto login
            //    req.user = User.findOne({ where: { id: 1 }});
            //}

            if (!req.user) {
                if (req.xhr) {
                    return res.status(401).send();
                }

                return res.redirect("/login");
            }

            return next();
        });

        app.get("/logout", (req, res) => {
            const name = req.user.name;
            req.logout();
            return res.send(`Bye, ${name}, come back soon!`);
        });

        // Web application
        app.get("/*", (req, res, next) => {
            res.sendFile(`${this.config.staticDir}/main-dev.html`, err => {
                if (err) {
                    next(err);
                }
            });
        });

        // error handling
        // app.use((error, req, res, next) => {
        //     console.error(error);
        //
        //     if (res.headersSent) {
        //         return next(error);
        //     }
        //
        //     if (req.accepts("json")) {
        //         // send JSON formatted error
        //         res.status(500).send({ error: `${error.name}: ${error.message}` });
        //     }
        //     else {
        //         // send generic error page
        //         res.status(500).render("errors/500", { error });
        //     }
        // });
    }

    async start()
    {
        this._server = new http.Server(this.app);
        await this._server.listen(this.config.port);
        console.info(`\n\nServer ready and listening on port ${this.config.port}\n`);
    }
}