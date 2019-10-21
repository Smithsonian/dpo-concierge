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

import { SubjectView, Subject } from "../schemas/Subject";
import { ViewParameters, getFindOptions } from "../schemas/View";

import SubjectModel from "../models/Subject";

////////////////////////////////////////////////////////////////////////////////

const searchFields = [
    "name",
    "description",
    "unitCode",
    "unitRecordId",
    "edanRecordId",
];

@Resolver()
export default class SubjectResolver
{
    @Query(returns => SubjectView)
    async subjectView(
        @Arg("view", type => ViewParameters) view: ViewParameters,
    ): Promise<SubjectView>
    {
        const findOptions = getFindOptions(view, searchFields);

        return SubjectModel.findAndCountAll(findOptions)
        .then(result => ({
            rows: result.rows.map(row => row.toJSON() as Subject),
            count: result.count,
        }));
    }

    @Query(returns => Subject, { nullable: true })
    async subject(
        @Arg("id", type => Int, { nullable: true }) id: number,
        @Arg("uuid", { nullable: true }) uuid: string,
    ): Promise<Subject | null>
    {
        if (id || uuid) {
            return (id ? SubjectModel.findByPk(id) : SubjectModel.findOne({ where: { uuid }}))
                .then(row => row ? row.toJSON() as Subject : null);
        }

        return Promise.resolve(null);
    }
}