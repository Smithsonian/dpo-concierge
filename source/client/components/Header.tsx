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

////////////////////////////////////////////////////////////////////////////////

import * as React from "react";
import { CSSProperties } from "react";

import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import HelpIcon from '@material-ui/icons/Help';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import NotificationsIcon from '@material-ui/icons/Notifications';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';

////////////////////////////////////////////////////////////////////////////////

const lightColor = 'rgba(255, 255, 255, 0.7)';

const styles = theme => ({
    secondaryBar: {
        zIndex: 0,
    },
    menuButton: {
        marginLeft: -theme.spacing(1),
    },
    iconButtonAvatar: {
        padding: 4,
    },
    link: {
        textDecoration: 'none',
        color: lightColor,
        '&:hover': {
            color: theme.palette.common.white,
        },
    },
    button: {
        borderColor: lightColor,
    },
});

/** Properties for [[Header]] component. */
export interface IHeaderProps
{
    classes: {
        secondaryBar: string;
        menuButton: string;
        iconButtonAvatar: string;
        link: string;
        button: string;
        avatar: string;
    };

    onDrawerToggle: any;
}

interface IHeaderState
{
}

class Header extends React.Component<IHeaderProps, IHeaderState>
{
    constructor(props: IHeaderProps)
    {
        super(props);

        this.state = {
        };
    }

    render()
    {
        const { classes, onDrawerToggle } = this.props;

        return (
            <React.Fragment>
                <AppBar color="primary" position="sticky" elevation={0}>
                    <Toolbar>
                        <Grid container spacing={1} alignItems="center">
                            <Hidden smUp>
                                <Grid item>
                                    <IconButton
                                        color="inherit"
                                        aria-label="open drawer"
                                        onClick={onDrawerToggle}
                                        className={classes.menuButton}
                                    >
                                        <MenuIcon />
                                    </IconButton>
                                </Grid>
                            </Hidden>
                            <Grid item xs />
                            <Grid item>
                                <Typography className={classes.link} component="a" href="#">
                                    Go to docs
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Tooltip title="Alerts • No alters">
                                    <IconButton color="inherit">
                                        <NotificationsIcon />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                            <Grid item>
                                <IconButton color="inherit" className={classes.iconButtonAvatar}>
                                    <Avatar
                                        className={classes.avatar}
                                        src="/static/images/avatar/1.jpg"
                                        alt="My Avatar"
                                    />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
                <AppBar
                    component="div"
                    className={classes.secondaryBar}
                    color="primary"
                    position="static"
                    elevation={0}
                >
                    <Toolbar>
                        <Grid container alignItems="center" spacing={1}>
                            <Grid item xs>
                                <Typography color="inherit" variant="h5" component="h1">
                                    Authentication
                                </Typography>
                            </Grid>
                            <Grid item>
                                <Button className={classes.button} variant="outlined" color="inherit" size="small">
                                    Web setup
                                </Button>
                            </Grid>
                            <Grid item>
                                <Tooltip title="Help">
                                    <IconButton color="inherit">
                                        <HelpIcon />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Toolbar>
                </AppBar>
                <AppBar
                    component="div"
                    className={classes.secondaryBar}
                    color="primary"
                    position="static"
                    elevation={0}
                >
                    <Tabs value={0} textColor="inherit">
                        <Tab textColor="inherit" label="Users" />
                        <Tab textColor="inherit" label="Sign-in method" />
                        <Tab textColor="inherit" label="Templates" />
                        <Tab textColor="inherit" label="Usage" />
                    </Tabs>
                </AppBar>
            </React.Fragment>
        );
    }
}

export default withStyles(styles)(Header);