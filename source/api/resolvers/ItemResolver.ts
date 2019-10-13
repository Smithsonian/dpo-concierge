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

import { Arg, Int, Query, Resolver } from "type-graphql";

import { ItemSchema } from "../schemas/Item";

import Item from "../models/Item";
import Subject from "../models/Subject";

////////////////////////////////////////////////////////////////////////////////

@Resolver(of => Item)
export default class ItemResolver
{
    @Query(returns => [ ItemSchema ])
    async items(
        @Arg("subjectId", type => Int, { nullable: true }) subjectId: number,
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    ): Promise<ItemSchema[]>
    {
        limit = limit ? limit : undefined;
        let query;

        if (subjectId) {
            query = Item.findAll({
                include: [ Subject ],
                where: { subjectId },
                offset,
                limit,
            });
        }
        else {
            query = Item.findAll({
                include: [ Subject ],
                offset,
                limit,
            });
        }

        return query.then(rows => rows.map(row => row.toJSON() as ItemSchema));
    }

    @Query(returns => ItemSchema, { nullable: true })
    async item(
        @Arg("id", type => Int) id: number,
    ): Promise<ItemSchema | null>
    {
        if (id) {
            return Item.findByPk(id)
                .then(row => row ? row.toJSON() as ItemSchema : null);
        }

        return Promise.resolve(null);
    }
}