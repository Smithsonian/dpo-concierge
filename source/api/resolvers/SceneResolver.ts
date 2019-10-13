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

import { SceneSchema } from "../schemas/Scene";
import Scene from "../models/Scene";
import Asset from "../models/Asset";
import Bin from "../models/Bin";
import ItemBin from "../models/ItemBin";
import Item from "../models/Item";

////////////////////////////////////////////////////////////////////////////////

@Resolver()
export default class SceneResolver
{
    @Query(returns => [ SceneSchema ])
    async scenes(
        @Arg("subjectId", type => Int, { nullable: true }) subjectId: number,
        @Arg("itemId", type => Int, { nullable: true }) itemId: number,
        @Arg("binId", type => Int, { nullable: true }) binId: number,
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    ): Promise<SceneSchema[]>
    {
        limit = limit ? limit : undefined;
        let query;

        if (binId) {
            query = Scene.findAll({
                where: { binId },
                include: [ Bin, Asset ],
                offset,
                limit
            });
        }
        else if (itemId) {
            query = Scene.findAll({
                include: [ Asset, {
                    model: Bin,
                    required: true,
                    include: [{
                        model: ItemBin,
                        attributes: [],
                        where: { itemId }
                    }],
                }],
                offset,
                limit
            });
        }
        else if (subjectId) {
            query = Scene.findAll({
                include: [ Asset, {
                    model: Bin,
                    required: true,
                    include: [{
                        model: ItemBin,
                        required: true,
                        attributes: [],
                        include: [{
                            model: Item,
                            attributes: [],
                            where: { subjectId }
                        }],
                    }],
                }],
                offset,
                limit,
            })
        }
        else {
            query = Scene.findAll({
                include: [ Bin, Asset ]
            });
        }

        return query.then(rows =>
            rows.map(row => row.toJSON() as SceneSchema)
        );
    }

    @Query(returns => SceneSchema, { nullable: true })
    async scene(
        @Arg("id", type => Int) id: number,
    ): Promise<SceneSchema | null>
    {
        if (id) {
            return Scene.findByPk(id, { include: [ Asset ]})
                .then(row => row ? row.toJSON() as SceneSchema : null);
        }

        return Promise.resolve(null);
    }
}