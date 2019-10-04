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

import { Route, Switch } from "react-router-dom";

import { withStyles, StyleRules } from '@material-ui/core/styles';

import Header, { IHeaderTab } from "./Header";

////////////////////////////////////////////////////////////////////////////////

export interface IPageView
{
    title: string;
    route: string;
    component: React.ComponentType;
}

export interface IPageProps
{
    title: string;
    views: IPageView[];
    onNavigatorToggle: () => void;
    match?: any;

    classes: {
        root: string;
        main: string;
    }
}

const styles = theme => ({
    root: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    main: {
        flex: 1,
        padding: "48px 36px 0",
        background: "#eaeff1",
    }
} as StyleRules);

const Page = function(props: IPageProps)
{
    const { classes, title, views, match, onNavigatorToggle } = props;


    const tabs: IHeaderTab[] = views.map(view => ({
        text: view.title,
        link: `${match.url}${view.route}`,
    }));

    return (
        <div className={classes.root}>
            <Header
                title={title}
                tabs={tabs}
                match={match}
                onNavigatorToggle={onNavigatorToggle}
            />
            <main className={classes.main}>
                <Switch>
                {views.map(view => (
                    <Route key={view.route} path={`${match.path}${view.route}`} component={view.component}></Route>
                ))}
                </Switch>
            </main>
        </div>
    );
};

export default withStyles(styles)(Page);