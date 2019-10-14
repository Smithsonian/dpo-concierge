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
        header: string;
        wrapper: string;
        main: string;
    }
}

const styles = theme => ({
    root: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    header: {
        flex: 0,
    },
    wrapper: {
        flex: 1,
        position: "relative",
    },
    main: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        padding: theme.spacing(3),
        background: "#eaeff1",
    }
} as StyleRules);

const Page = function(props: React.PropsWithChildren<IPageProps>)
{
    const { children, classes, title, views, match, onNavigatorToggle } = props;

    const tabs: IHeaderTab[] = views.map(view => ({
        text: view.title,
        link: `${match.url}${view.route}`,
    }));

    return (
        <div className={classes.root}>
            <Header
                className={classes.header}
                title={title}
                tabs={tabs}
                pathPrefix={match.path}
                onNavigatorToggle={onNavigatorToggle}
            />
            <div className={classes.wrapper}>
                <main className={classes.main}>
                    <Switch>
                        {views.map(view => (
                            <Route key={view.route} path={`${match.path}${view.route}`} component={view.component} />
                        ))}
                        {children}
                    </Switch>
                </main>
            </div>
        </div>
    );
};

export default withStyles(styles)(Page);