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
import { CSSProperties } from "react";

import Button from "@material-ui/core/Button";

import { withStyles } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Hidden from '@material-ui/core/Hidden';

import { theme, drawerWidth, styles } from "./components/theme";

import Header from "./components/Header";
import Navigator from "./components/Navigator";
import Content from "./components/Content";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[Application]] component. */
export interface IApplicationProps
{
    classes: {
        root: string;
        drawer: string;
        appContent: string;
        mainContent: string;
    };
}

interface IApplicationState
{
    mobileOpen: boolean;
}

class Application extends React.Component<IApplicationProps, IApplicationState>
{
    constructor(props: IApplicationProps)
    {
        super(props);

        this.state = {
            mobileOpen: false,
        };

        this.handleDrawerToggle = this.handleDrawerToggle.bind(this);
    }

    render()
    {
        const classes = this.props.classes;

        return (
            <ThemeProvider theme={theme}>
                <div className={classes.root}>
                    <CssBaseline />
                    <nav className={classes.drawer}>
                        <Hidden smUp implementation="js">
                            <Navigator
                                PaperProps={{ style: { width: drawerWidth } }}
                                variant="temporary"
                                open={this.state.mobileOpen}
                                onClose={this.handleDrawerToggle}
                            />
                        </Hidden>
                        <Hidden xsDown implementation="css">
                            <Navigator PaperProps={{ style: { width: drawerWidth } }} />
                        </Hidden>
                    </nav>
                    <div className={classes.appContent}>
                        <Header onDrawerToggle={this.handleDrawerToggle} />
                        <main className={classes.mainContent}>
                            <Content />
                        </main>
                    </div>
                </div>
            </ThemeProvider>
        );
    }

    protected handleDrawerToggle()
    {
        this.setState(state => ({ mobileOpen: !state.mobileOpen }));
    }
}

export default withStyles(styles)(Application);