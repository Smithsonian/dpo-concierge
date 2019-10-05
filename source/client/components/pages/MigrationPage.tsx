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

import MigrationSpreadsheetView from "../views/MigrationSpreadsheetView";
import MigratePlayView from "../views/MigratePlayView";
import NotYetImplementedView from "../views/NotYetImplementedView";

import Page, { IPageView } from "../Page";

////////////////////////////////////////////////////////////////////////////////

const views: IPageView[] = [
    { title: "Spreadsheet", component: MigrationSpreadsheetView, route: "/spreadsheet" },
    { title: "Migrate Play", component: MigratePlayView, route: "/play" },
    { title: "Migrate Legacy", component: NotYetImplementedView, route: "/legacy" },
];

export interface IPageProps
{
    onNavigatorToggle: () => void;
    match?: any;
}

export default class MigrationPage extends React.Component<IPageProps, {}>
{
    render()
    {
        return (
            <Page
                title="Migration"
                views={views}
                {...this.props}
            />
        );
    }
}

