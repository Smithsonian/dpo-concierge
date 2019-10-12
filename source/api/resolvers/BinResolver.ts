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

import Bin from "../models/Bin";
import { BinSchema } from "../schemas/Bin";

import ItemBin from "../models/ItemBin";
import Item from "../models/Item";
import BinType from "../models/BinType";
import Asset from "../models/Asset";

////////////////////////////////////////////////////////////////////////////////

@Resolver()
export default class BinResolver
{
    @Query(returns => [ BinSchema ])
    bins(
        @Arg("itemId", type => Int, { nullable: true }) itemId: number,
        @Arg("jobId", type => Int, { nullable: true }) jobId: number,
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    )
    {
        limit = limit ? limit : undefined;

        if (itemId) {
            return Bin.findAll({
                offset,
                limit,
                // where: {
                //     include: [{ model: ItemBin, where: { itemId }}]
                // },
                include: [{
                    model: ItemBin,
                    attributes: [],
                    where: { itemId },
                }],
            })
            .then(rows =>
                rows.map(row => row.toJSON() as BinSchema)
            );
        }
        else if (jobId) {

        }

        return Bin.findAll({ offset, limit, include: [BinType] })
            .then(rows => rows.map(row => row.toJSON() as BinSchema));
    }

    @Query(returns => BinSchema, { nullable: true })
    bin(
        @Arg("id", type => Int) id: number,
    ): Promise<BinSchema | null>
    {
        return Bin.findByPk(id, { include: [BinType, Asset] })
            .then(row => row ? row.toJSON() as BinSchema : null);
    }
}