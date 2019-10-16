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

const storage = window.localStorage;

export function getStorageObject<T = any>(key: string, defaultObject?: T): T
{
    const json = storage ? storage.getItem(key) : undefined;
    const data = json && JSON.parse(json);

    if (defaultObject !== undefined && typeof defaultObject !== "object") {
        return data !== undefined ? data : defaultObject;
    }

    return Object.assign({}, defaultObject, data);
}

export function setStorageObject(key: string, object: any)
{
    const json = JSON.stringify(object);
    storage && storage.setItem(key, json);
}

export function mergeStorageObject(key: string, object: any)
{
    const prevObject = getStorageObject(key);
    setStorageObject(key, Object.assign({}, prevObject, object));
}