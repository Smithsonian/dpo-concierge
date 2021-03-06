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

import { Asset, AssetView } from "../schemas/Asset";
import { ViewParameters, getFindOptions } from "../schemas/View";
import { Status } from "../schemas/Status";

import AssetModel from "../models/Asset";
import BinModel from "../models/Bin";

import ManagedRepository from "../utils/ManagedRepository";

////////////////////////////////////////////////////////////////////////////////

const searchFields = [
    "filePath",
];

@Resolver()
export default class AssetResolver
{
    @Query(returns => AssetView)
    async assetView(
        @Arg("binId", type => Int, { nullable: true }) binId: number,
        @Arg("view", type => ViewParameters) view: ViewParameters,
    ): Promise<AssetView>
    {
        let options;

        if (binId) {
            options = {
                include: [ { model: BinModel, attributes: [ "uuid", "version" ] }],
                where: { binId },
            };
        }
        else {
            options = {
                include: [ { model: BinModel, attributes: [ "uuid", "version" ] }],
            };
        }

        const findOptions = getFindOptions(view, searchFields, options);

        return AssetModel.findAndCountAll(findOptions)
            .then(result => ({
                rows: result.rows.map(row => {
                    const asset = row.toJSON() as Asset;
                    asset.path = row.path;
                    asset.name = row.name;
                    asset.extension = row.extension;
                    asset.mimeType = row.mimeType;
                    asset.binUuid = row.bin.uuid;
                    return asset;
                }),
                count: result.count,
            }));
    }

    @Query(returns => Asset, { nullable: true })
    asset(
        @Arg("id", type => Int) id: number,
        @Arg("uuid") uuid: string,
    ): Promise<Asset | null>
    {
        return (id ? AssetModel.findByPk(id) : AssetModel.findOne({ where: { uuid }}))
            .then(row => row ? row.toJSON() as Asset : null);
    }

    @Mutation(returns => Status)
    deleteAsset(
        @Arg("id", type => Int) id: number,
    ): Promise<Status>
    {
        let asset;

        return AssetModel.findByPk(id, { include: [BinModel] })
            .then(_asset => {
                asset = _asset;

                if (!asset) {
                    return { ok: false, message: `can't delete, asset ${id} not found`};
                }

                const repo = Container.get(ManagedRepository);

                return repo.deleteAssetFile(asset)
                    .catch(error =>
                        console.log(`[AssetResolver] - failed to delete asset file: '${asset.filePath}'`)
                    );

            })
            .then(() => asset.destroy())
            .then(() => ({ ok: true, message: "" }))
            .catch(error => ({ ok: false, message: error.message }));
    }
}