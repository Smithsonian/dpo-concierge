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

import { Arg, FieldResolver, Query, Resolver, Root } from "type-graphql";

import { ItemType } from "../schemas/Item";
import Item from "../models/Item";

////////////////////////////////////////////////////////////////////////////////

@Resolver(of => Item)
export default class ItemResolver
{
    @Query(returns => [ ItemType ])
    items(): Promise<ItemType[]>
    {
        return Item.findAll()
            .then(rows => rows.map(row => row.toJSON() as ItemType));
    }

    @Query(returns => ItemType, { nullable: true })
    item(
        @Arg("name") name: string,
        @Arg("uuid") uuid: string,
    ): Promise<ItemType | null>
    {
        const query: any = {};
        if (name) query.name = name;
        if (uuid) query.uud = uuid;

        return Item.findOne({ where: query })
            .then(row => row ? row.toJSON() as ItemType : null);
    }
}