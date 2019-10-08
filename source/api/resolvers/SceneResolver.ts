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

import { SceneType } from "../schemas/Scene";
import Scene from "../models/Scene";
import Asset from "../models/Asset";

////////////////////////////////////////////////////////////////////////////////

@Resolver()
export default class SceneResolver
{
    @Query(returns => [ SceneType ])
    scenes(
        @Arg("itemId", type => Int, { nullable: true }) itemId: number,
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    ): Promise<SceneType[]>
    {
        limit = limit ? limit : undefined;

        return Scene.findAll({ include: [ Asset ], offset, limit })
            .then(rows => rows.map(row => row.toJSON() as SceneType));
    }

    @Query(returns => SceneType, { nullable: true })
    scene(
        @Arg("id", type => Int) id: number,
    ): Promise<SceneType | null>
    {
        return Scene.findByPk(id, { include: [ Asset ]})
            .then(row => row ? row.toJSON() as SceneType : null);
    }
}