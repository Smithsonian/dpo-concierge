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

import { Arg, Int, Query, Mutation, Resolver } from "type-graphql";
import { Container } from "typedi";

import Bin from "../models/Bin";
import { BinSchema } from "../schemas/Bin";
import { StatusSchema } from "../schemas/Status";

import ItemBin from "../models/ItemBin";
import JobBin from "../models/JobBin";
import BinType from "../models/BinType";
import Asset from "../models/Asset";

import ManagedRepository from "../utils/ManagedRepository";

////////////////////////////////////////////////////////////////////////////////

@Resolver()
export default class BinResolver
{
    @Query(returns => [ BinSchema ])
    async bins(
        @Arg("itemId", type => Int, { nullable: true }) itemId: number,
        @Arg("jobId", type => Int, { nullable: true }) jobId: number,
        @Arg("offset", type => Int, { defaultValue: 0 }) offset: number,
        @Arg("limit", type => Int, { defaultValue: 50 }) limit: number,
    )
    {
        limit = limit ? limit : undefined;
        let query;

        if (itemId) {
            query = Bin.findAll({
                include: [ BinType, {
                    model: ItemBin,
                    attributes: [],
                    where: { itemId },
                }],
                offset,
                limit,
            });
        }
        else if (jobId) {
            query = Bin.findAll({
                include: [ BinType, {
                    model: JobBin,
                    attributes: [],
                    where: { jobId }
                }],
                offset,
                limit,
            });
        }
        else {
            query = Bin.findAll({
                include: [ BinType ],
                offset,
                limit,
            });
        }

        return query.then(rows => rows.map(row => row.toJSON() as BinSchema));
    }

    @Query(returns => BinSchema, { nullable: true })
    async bin(
        @Arg("id", type => Int) id: number,
    ): Promise<BinSchema | null>
    {
        if (id) {
            return Bin.findByPk(id, { include: [BinType, Asset] })
                .then(row => row ? row.toJSON() as BinSchema : null);
        }

        return Promise.resolve(null);
    }

    @Mutation(returns => StatusSchema)
    async grantBinAccess(
        @Arg("uuid", type => String) uuid: string,
    ): Promise<StatusSchema>
    {
        return Bin.getLatestVersion(uuid)
            .then(bin => {
                if (!bin) {
                    return { ok: false, message: `bin not found with uuid: ${uuid}` };
                }

                return Container.get(ManagedRepository).grantWebDAVAccess(bin)
                    .then(() => ({ ok: true, message: "" }))
                    .catch(err => ({ ok: false, message: err.message }));
            });
    }

    @Mutation(returns => StatusSchema)
    async revokeBinAccess(
        @Arg("uuid", type => String) uuid: string,
    ): Promise<StatusSchema>
    {
        return Bin.getLatestVersion(uuid)
        .then(bin => {
            if (!bin) {
                return { ok: false, message: `bin not found with uuid: ${uuid}` };
            }

            return Container.get(ManagedRepository).revokeWebDAVAccess(bin)
            .then(() => ({ ok: true, message: "" }))
            .catch(err => ({ ok: false, message: err.message }));
        });
    }
}