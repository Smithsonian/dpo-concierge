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

import { AssetSchema } from "../schemas/Asset";
import Asset from "../models/Asset";

////////////////////////////////////////////////////////////////////////////////

@Resolver()
export default class AssetResolver
{
    @Query(returns => [ AssetSchema ])
    assets(
        @Arg("binId", type => Int, { nullable: true }) binId: number,
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    ): Promise<AssetSchema[]>
    {
        limit = limit ? limit : undefined;
        const where = binId !== undefined ? { binId } : undefined;

        return Asset.findAll({ where, offset, limit })
            .then(rows => rows.map(row => {
                const asset = row.toJSON() as AssetSchema;
                asset.path = row.path;
                asset.name = row.name;
                asset.extension = row.extension;
                asset.mimeType = row.mimeType;
                return asset;
            }));
    }

    @Query(returns => AssetSchema, { nullable: true })
    asset(
        @Arg("id", type => Int) id: number,
        @Arg("uuid") uuid: string,
    ): Promise<AssetSchema | null>
    {
        return (id ? Asset.findByPk(id) : Asset.findOne({ where: { uuid }}))
            .then(row => row ? row.toJSON() as AssetSchema : null);
    }
}