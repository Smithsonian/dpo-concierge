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

import { Table, Column, Model, HasMany, BelongsToMany, AfterSync } from "sequelize-typescript";

import User from "./User";
import Permission from "./Permission";

////////////////////////////////////////////////////////////////////////////////

@Table
export default class Role extends Model<Role>
{
    static readonly presets = {
        admin: "admin",
        user: "user",
    };

    static readonly permissions = {
        admin: [ "userCreate", "repoRead", "repoWrite" ],
        user: [ "repoRead", "repoWrite" ],
    };

    @AfterSync
    static async populate()
    {
        const presets = Role.presets;

        return Role.count().then(count => {
            if (count === 0) {
                return Role.bulkCreate([
                    { id: presets.admin, name: "Admin "},
                    { id: presets.user, name: "User "},
                ]);
            }
        });
    }

    static async populateDefaultPermissions()
    {
        return Role.findAll().then(roles => Promise.all(roles.map(role => {
            role.$set("permissions", Role.permissions[role.id]);
            return role.save();
        })));
    }

    @Column({ primaryKey: true })
    id: string;

    @Column
    name: string;

    @BelongsToMany(() => Permission, "RolePermissions", "roleId", "permissionId")
    permissions: Permission[];

    @HasMany(() => User)
    users: User[];
}
