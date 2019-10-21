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

import "reflect-metadata";
import { Field, InputType, Int } from "type-graphql";
import { FindOptions, Op } from "sequelize";

////////////////////////////////////////////////////////////////////////////////

@InputType()
export class ViewParameters
{
    @Field(() => Int)
    page: number;

    @Field(() => Int)
    rowsPerPage: number;

    @Field({ nullable: true })
    order: string;

    @Field({ nullable: true })
    orderBy: string;

    @Field({ nullable: true })
    search: string;
}

export function getFindOptions(view: ViewParameters, searchFields: string[] = [], options?: FindOptions): FindOptions
{
    let where = options ? options.where : undefined;

    if (view.search) {
        if (searchFields.length > 1) {
            where = { ...where, [Op.or]: searchFields.map(field =>({ [field]: { [Op.substring]: view.search }} )) };
        }
        else if (searchFields.length > 0) {
            where = { ...where, [searchFields[0]]: { [Op.substring]: view.search } };
        }
    }

    const params: any = { ...options };

    if (where) {
        params.where = where;
    }

    const offset = view.page * view.rowsPerPage;
    if (offset > 0) {
        params.offset = offset;
    }

    if (view.rowsPerPage > 0) {
        params.limit = view.rowsPerPage;
    }

    if (view.orderBy) {
        params.order = [ [view.orderBy, view.order] ];
    }

    console.log(view);
    console.log(params);
    return params;
}