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

import { Table, Column, Model, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import * as bcrypt from "bcrypt";

import Project from "./Project";
import Role from "./Role";
import Permission from "./Permission";
import { UserSchema } from "../schemas/User";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class User extends Model<User>
{
    static async findWithPermissions(id: string)
    {
        return this.findByPk(id, {
            attributes: ["id", "name", "activeProjectId"],
            include: [
                { model: Project, as: "activeProject" },
                { model: Role, include: [ Permission ], attributes: ["id"] },
            ],
            logging: () => console.log(`[User] -logging in ID ${id}`),
        });
    }

    static async createWithProject(name: string, email: string, password: string)
    {
        return User.findOne({ where: { email }})
        .then(user => {
            if (user) {
                throw new Error(`User with email '${user.email}' already registered.`);
            }
        })
        .then(() => User.getPasswordHash(password))
        .then(hash => User.create({ name, email, password: hash }))
        .then(user => (
            Project.create({ ownerId: user.id, name: "My First Project" })
                .then(project => {
                    user.activeProjectId = project.id;
                    return user.save().then(user => user.toJSON() as UserSchema);
                })
        ));
    }

    static async login(email: string, password: string): Promise<{ ok: boolean, user?: User, message?: string }>
    {
        return User.findOne({ where: { email }}).then(user => {
            if (!user) {
                console.log(`[Passport.LocalStrategy] user email not found: ${email}`);
                return { ok: false, message: `Can't find user with email '${email}'.` };
            }

            return user.isValidPassword(password).then(result => {
                if (result) {
                    console.log(`[Passport.LocalStrategy] authenticated user: ${email}`);
                    return { ok: true, user };
                } else {
                    console.log(`[Passport.LocalStrategy] - password mismatch for user: ${email}`);
                    return { ok: false, message: `Incorrect password.` };
                }
            });
        });
    }

    static async getPasswordHash(password: string): Promise<string>
    {
        return await bcrypt.hash(password, 10);
    }

    async isValidPassword(password: string): Promise<boolean>
    {
        return await bcrypt.compare(password, this.password);
    }

    @Column({ allowNull: false })
    name: string;

    @Column({ allowNull: false })
    email: string;

    @Column
    password: string;

    @Column({ defaultValue: false, allowNull: false })
    blocked: boolean;

    @ForeignKey(() => Role)
    @Column({ allowNull: false, defaultValue: Role.presets.admin })
    roleId: string;

    @BelongsTo(() => Role)
    role: Role;

    @ForeignKey(() => Project)
    @Column
    activeProjectId: number;

    @BelongsTo(() => Project, { constraints: false })
    activeProject: Project;

    @HasMany(() => Project)
    projects: Project[];
}