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

import { BrowserRouter, Route, Switch } from "react-router-dom";

import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";
import { WebSocketLink } from "apollo-link-ws";
import { SubscriptionClient } from "subscriptions-transport-ws";
import { onError } from "apollo-link-error";
import { InMemoryCache } from "apollo-cache-inmemory";
import { getMainDefinition } from "apollo-utilities";
import { ApolloProvider } from "@apollo/react-hooks";

import { ThemeProvider } from '@material-ui/styles';
import { withStyles, StyleRules } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import Navigator from "./Navigator";
import { theme } from "./theme";

import RepositoryPage from "./pages/RepositoryPage";
import WorkflowPage from "./pages/WorkflowPage";
import IngestPage from "./pages/IngestPage";
import MigrationPage from "./pages/MigrationPage";
import AdminPage from "./pages/AdminPage";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[Application]] component. */
export interface IApplicationProps
{
    classes: {
        root: string;
    };
}

export interface IApplicationState
{
    isNavigatorOpen: boolean;
}

const styles = theme => ({
    root: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        display: "flex",
    },
} as StyleRules);

class Application extends React.Component<IApplicationProps, IApplicationState>
{
    protected client: ApolloClient<any>;

    constructor(props: IApplicationProps)
    {
        super(props);

        this.toggleNavigator = this.toggleNavigator.bind(this);

        this.state = {
            isNavigatorOpen: false,
        };

        const wsProto = location.protocol === "https:" ? "wss:" : "ws:";
        const subscriptionsEndpoint = `${wsProto}//${location.host}/subscriptions`;
        const client = new SubscriptionClient(subscriptionsEndpoint, { reconnect: true });

        const link = ApolloLink.from([
            onError(({ graphQLErrors, networkError }) => {
                if (graphQLErrors)
                    graphQLErrors.map(({ message, locations, path }) => {
                        message && console.warn(`[GraphQL error] Message: ${message}`);
                        path && console.warn(`[GraphQL error] Path: ${path}`);
                        //locations.forEach(location => console.warn(location));
                    });

                if (networkError) {
                    console.log(`[Network error]: ${networkError}`);
                }
            }),
            ApolloLink.split(({ query }) => {
                    const def = getMainDefinition(query);
                    return def.kind === "OperationDefinition" && def.operation === "subscription";
                },
                new WebSocketLink(client),
                new HttpLink({ uri: "/graphql" }),
            ),
        ]);

        this.client = new ApolloClient({
            link,
            cache: new InMemoryCache(),
            name: "concierge-web-client",
        });
    }

    render()
    {
        const { classes } = this.props;

        return (
            <ThemeProvider theme={theme}>
                <ApolloProvider client={this.client}>
                    <BrowserRouter>
                        <div className={classes.root}>
                            <CssBaseline />
                            <Navigator
                                open={this.state.isNavigatorOpen}
                                onClose={this.toggleNavigator}
                            />
                            <Switch>
                                <Route path="/repository" render={props => <RepositoryPage {...props} onNavigatorToggle={this.toggleNavigator}/>} />
                                <Route path="/workflow" render={props => <WorkflowPage {...props} onNavigatorToggle={this.toggleNavigator}/>} />
                                <Route path="/ingest" render={props => <IngestPage {...props} onNavigatorToggle={this.toggleNavigator}/>} />
                                <Route path="/migration" render={props => <MigrationPage {...props} onNavigatorToggle={this.toggleNavigator}/>} />
                                <Route path="/admin" render={props => <AdminPage {...props} onNavigatorToggle={this.toggleNavigator}/>} />
                            </Switch>
                        </div>
                    </BrowserRouter>
                </ApolloProvider>
            </ThemeProvider>
        );
    }

    protected toggleNavigator()
    {
        this.setState(state => ({ isNavigatorOpen: !state.isNavigatorOpen }));
    }
}

export default withStyles(styles)(Application);