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

import { Bin, BinView } from "../schemas/Bin";
import { Status } from "../schemas/Status";
import { ViewParameters, getFindOptions } from "../schemas/View";

import BinModel from "../models/Bin";
import ItemBinModel from "../models/ItemBin";
import JobBinModel from "../models/JobBin";
import BinTypeModel from "../models/BinType";
import AssetModel from "../models/Asset";

import ManagedRepository from "../utils/ManagedRepository";

////////////////////////////////////////////////////////////////////////////////

const searchFields = [
    "name",
    "description",
];

@Resolver()
export default class BinResolver
{
    @Query(returns => BinView)
    async binView(
        @Arg("itemId", type => Int, { nullable: true }) itemId: number,
        @Arg("jobId", type => Int, { nullable: true }) jobId: number,
        @Arg("view", type => ViewParameters) view: ViewParameters,
    )
    {
        let options;

        if (itemId) {
            options = {
                include: [ BinTypeModel, {
                    model: ItemBinModel,
                    attributes: [],
                    where: { itemId },
                }],
            };
        }
        else if (jobId) {
            options = {
                include: [ BinTypeModel, {
                    model: JobBinModel,
                    attributes: [],
                    where: { jobId }
                }],
            };
        }
        else {
            options = {
                include: [ BinTypeModel ],
            };
        }

        const findOptions = getFindOptions(view, searchFields, options);

        return BinModel.findAndCountAll(findOptions)
            .then(result => ({
                rows: result.rows.map(row => row.toJSON() as Bin),
                count: result.count,
            }));
    }

    @Query(returns => Bin, { nullable: true })
    async bin(
        @Arg("id", type => Int) id: number,
    ): Promise<Bin | null>
    {
        if (id) {
            return BinModel.findByPk(id, { include: [BinTypeModel, AssetModel] })
                .then(row => row ? row.toJSON() as Bin : null);
        }

        return Promise.resolve(null);
    }

    @Mutation(returns => Status)
    async grantBinAccess(
        @Arg("uuid", type => String) uuid: string,
    ): Promise<Status>
    {
        return BinModel.getLatestVersion(uuid)
            .then(bin => {
                if (!bin) {
                    return { ok: false, message: `bin not found with uuid: ${uuid}` };
                }

                return Container.get(ManagedRepository).grantWebDAVAccess(bin)
                    .then(() => ({ ok: true, message: "" }))
                    .catch(err => ({ ok: false, message: err.message }));
            });
    }

    @Mutation(returns => Status)
    async revokeBinAccess(
        @Arg("uuid", type => String) uuid: string,
    ): Promise<Status>
    {
        return BinModel.getLatestVersion(uuid)
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