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

import * as React from "react";

import SubjectListView from "../views/SubjectListView";
import ItemListView from "../views/ItemListView";
import GroupListView from "../views/GroupListView";
import AssetListView from "../views/AssetListView";

import Page, { IPageView } from "../Page";

////////////////////////////////////////////////////////////////////////////////

const views: IPageView[] = [
    { title: "Subjects", component: SubjectListView, route: "/subjects" },
    { title: "Items", component: ItemListView, route: "/items" },
    { title: "Groups", component: GroupListView, route: "/groups" },
    { title: "Assets", component: AssetListView, route: "/assets" },
//    { title: "Units", component: NotYetImplementedView, route: "/units" },
//    { title: "Stakeholders", component: NotYetImplementedView, route: "/stakeholders" },
];

export interface IPageProps
{
    onNavigatorToggle: () => void;
}

export default (props: IPageProps) => (
    <Page
        title="Repository"
        views={views}
        {...props}
    />
);
