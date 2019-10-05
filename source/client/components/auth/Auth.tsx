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
import { HttpLink } from "apollo-link-http";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloProvider } from "@apollo/react-hooks";

import { ThemeProvider } from "@material-ui/styles";
import { withStyles, StyleRules } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";

import { theme } from "../theme";

import Login from "./Login";
import Register from "./Register";

////////////////////////////////////////////////////////////////////////////////

export interface IAuthProps
{
    classes: {
        root: string;
        paper: string;
    }
}

class Auth extends React.Component<IAuthProps, {}>
{
    protected client: ApolloClient<any>;

    constructor(props: IAuthProps)
    {
        super(props);

        this.client = new ApolloClient({
            link: new HttpLink({ uri: "/graphql" }),
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
                            <Container component="main" maxWidth="xs">
                                <Paper className={classes.paper}>
                                    <Switch>
                                        <Route path="/login" render={props => <Login {...props}/>} />
                                        <Route path="/register" render={props => <Register {...props}/>} />
                                    </Switch>
                                </Paper>
                            </Container>
                        </div>

                    </BrowserRouter>
                </ApolloProvider>
            </ThemeProvider>

        );
    }
}

const styles = theme => ({
    root: {
    },
    paper: {
        marginTop: theme.spacing(8),
        padding: theme.spacing(3),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }
} as StyleRules);

export default withStyles(styles)(Auth);
