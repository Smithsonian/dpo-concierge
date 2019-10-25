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

import * as fs from "fs";
import * as crypto from "crypto";
import * as fetch from "node-fetch";

import uuid from "uuidv4";
import { Dictionary } from "./types";

////////////////////////////////////////////////////////////////////////////////

export interface IEdanQuery
{
    q?: string;
    fqs?: string | string[];
    rows?: number;
    start?: number;
    sortDir?: "asc" | "desc";
    facet?: boolean;
}

export interface IEdanQueryResult
{
    rows?: IEdanEntry[];
}

export interface IEdanEntry
{
    id: string;
    title: string;
    unitCode: string;
    type: string;
    url: string;
    content: IEdanContent;
    timestamp: number;
    lastTimeUpdated: number;
    status: number;
    version: string;
    publicSearch: boolean;
}

export interface IEdanContent
{
    descriptiveNonRepeating: Dictionary<any>;
    indexedStructured: Dictionary<string[]>;
    freeText: Dictionary<IEdanFreeTextEntry[]>;
}

export interface IEdanFreeTextEntry
{
    label: string;
    content: string;
}

export default class EDANClient
{
    readonly appId: string;
    readonly appKey: string;

    static readonly edanBaseUrl = "http://edan.si.edu/";
    static readonly collectionsSearchApi = "metadata/v2.0/collections/search.htm?";
    static readonly metadataSearchApi = "metadata/v2.0/metadata/search.htm?";

    constructor(appId: string, appKey: string)
    {
        if (!appId || !appKey) {
            throw new Error("EDANClient.constructor - missing appId and/or appKey");
        }

        this.appId = appId;
        this.appKey = appKey;
    }

    async fetchMdmRecord(id: string): Promise<IEdanQueryResult>
    {
        id = id.replace("edanmdm:", "edanmdm-");

        if (!id.startsWith("edanmdm-")) {
            console.log(`[EDANClient] can't fetch, invalid record id: ${id}`);
            throw new Error(`Can't fetch, invalid record id: ${id}`);
        }

        console.log(`[EDANClient] fetching record for id: '${id}'`);

        return this.search({ fqs: "id:" + id, rows: 1, facet: true });
            // .then(result =>
            //     fs.promises.writeFile("edan-search-result.json", JSON.stringify(result, null, 2))
            //         .then(() => result)
            // );
    }

    async search(query: IEdanQuery, metadataSearch: boolean = false): Promise<IEdanQueryResult>
    {
        const q = Object.assign({}, query);
        delete q["fqs"];

        let queryString = this.serializeQuery(q);

        if (query.fqs) {
            const fqs = Array.isArray(query.fqs) ? query.fqs : [ query.fqs ];
            queryString += "&fqs=" +  encodeURI(JSON.stringify(fqs));
        }

        const headers = this.composeHeader(queryString);

        const api = metadataSearch ? EDANClient.metadataSearchApi : EDANClient.collectionsSearchApi;
        const url = EDANClient.edanBaseUrl + api + queryString;

        console.log(`[EDANClient] search: ${url}`);

        return fetch(url, {
            method: "GET",
            headers
        })
        .then(result => result.json())
    }

    protected transformToVoyagerMeta(entry: IEdanEntry): Dictionary<string>
    {
        const meta: Dictionary<string> = {};

        meta.title = entry.title;
        meta.id = entry.id;
        meta.unitCode = entry.unitCode;

        const freeText = entry.content.freeText;

        Object.keys(freeText).forEach(key => {
            freeText[key].forEach(entry => {
                let text = meta[entry.label];
                meta[entry.label] = text ? `${text}, ${entry.content}` : entry.content;
            });
        });

        return meta;
    }

    protected serializeQuery(query: object): string
    {
        return Object.keys(query).reduce((accum, key) => {
            accum.push(key + "=" + encodeURIComponent(query[key]).replace(/'/g, '%27'));
            return accum;
        }, []).join('&');
    }

    protected composeHeader(queryString: string): object
    {
        const appId = this.appId;
        const appKey = this.appKey;
        const requestDate = new Date().toISOString();
        const nonce = uuid();

        const content = `${nonce}\n${queryString}\n${requestDate}\n${appKey}`;
        const hash = crypto.createHash('sha1').update(content).digest("hex");
        const encryptedContent = Buffer.from(hash).toString("base64");

        return {
            "X-AppId": appId,
            "X-RequestDate": requestDate,
            "X-Nonce": nonce,
            "X-AuthContent": encryptedContent
        };
    }
}