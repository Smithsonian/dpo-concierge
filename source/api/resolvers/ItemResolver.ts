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

import { Item, ItemView } from "../schemas/Item";
import { ViewParameters, getFindOptions } from "../schemas/View";

import ItemModel from "../models/Item";
import SubjectModel from "../models/Subject";

////////////////////////////////////////////////////////////////////////////////

const searchFields = [
    "name",
    "description",
];

@Resolver()
export default class ItemResolver
{
    @Query(returns => ItemView)
    async itemView(
        @Arg("subjectId", type => Int, { nullable: true }) subjectId: number,
        @Arg("view", type => ViewParameters) view: ViewParameters,
    ): Promise<ItemView>
    {
        let options;

        if (subjectId) {
            options = {
                include: [ SubjectModel ],
                where: { subjectId },
            };
        }
        else {
            options = {
                include: [ SubjectModel ],
            };
        }

        const findOptions = getFindOptions(view, searchFields, options);

        return ItemModel.findAndCountAll(findOptions)
            .then(result => ({
                rows: result.rows.map(row => row.toJSON() as Item),
                count: result.count,
            }));
    }

    @Query(returns => Item, { nullable: true })
    async item(
        @Arg("id", type => Int) id: number,
    ): Promise<Item | null>
    {
        if (id) {
            return ItemModel.findByPk(id)
                .then(row => row ? row.toJSON() as Item : null);
        }

        return Promise.resolve(null);
    }
}