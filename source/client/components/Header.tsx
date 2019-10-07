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

import { NavLink } from "react-router-dom";

import { withStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Toolbar from '@material-ui/core/Toolbar';
import Hidden from '@material-ui/core/Hidden';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import PersonIcon from "@material-ui/icons/Person";

import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

////////////////////////////////////////////////////////////////////////////////

export interface IHeaderTab
{
    text: string;
    link: string;
}

export interface IHeaderProps
{
    className?: string;
    title: string;
    tabs: IHeaderTab[];
    pathPrefix: string;

    classes: {
        user: string;
        avatar: string;
        menuButton: string;
        iconButtonAvatar: string;
    };

    onNavigatorToggle: () => void;
}

function TabLink(props) {
    const { label, to, value } = props;

    const linkRef = React.useMemo(
        () =>
            React.forwardRef((itemProps, ref) => (
                <NavLink to={to} {...itemProps} innerRef={ref} />
            )),
        [to],
    );

    return (
        <Tab component={linkRef} label={label} value={value} />
    );
}

export const QUERY_ACTIVE_USER = gql`
query {
    me {
        name
        activeProject {
            id, name
        }
    }
}`;

const UserAvatar = withStyles(theme => ({
    user: {
        display: "flex",
        alignItems: "center",
    },
    avatar: {
        marginLeft: theme.spacing(1)
    },
}))((props: any) => {
    const { classes } = props;
    const { loading, error, data } = useQuery(QUERY_ACTIVE_USER);

    let name = "not logged in";
    let project = "no active project";

    if (data && data.me) {
        name = data.me.name;
        if (data.me.activeProject) {
            project = data.me.activeProject.name;
        }
    }

    return (
        <div className={classes.user}>
            <div>
                <Typography variant="body2" style={{ textAlign: "end" }}>
                    { name }
                </Typography>
                <Typography variant="body1" style={{ textAlign: "end" }}>
                    { project }
                </Typography>
            </div>
            {/*<IconButton color="inherit" className={classes.iconButtonAvatar}>*/}
            <Avatar className={classes.avatar}>
                <PersonIcon />
            </Avatar>
            {/*</IconButton>*/}
        </div>
    );
});

class Header extends React.Component<IHeaderProps, {}>
{
    render()
    {
        const { className, classes, title, tabs, pathPrefix, onNavigatorToggle } = this.props;

        const subPath = window.location.pathname.substr(pathPrefix.length).split("/")[1];

        return (
            <AppBar
                position="static"
                elevation={0}
            >
                <Toolbar className={className}>
                    <Grid container spacing={1} alignItems="stretch">
                        <Hidden smUp>
                            <Grid item>
                                <IconButton
                                    color="inherit"
                                    aria-label="open drawer"
                                    onClick={onNavigatorToggle}
                                    className={classes.menuButton}
                                >
                                    <MenuIcon />
                                </IconButton>
                            </Grid>
                        </Hidden>
                        <Grid item xs />
                        <Grid item>
                            <UserAvatar/>
                        </Grid>
                    </Grid>
                </Toolbar>
                <Toolbar>
                    <Typography color="inherit" variant="h5" component="h1">
                        {title}
                    </Typography>
                </Toolbar>
                <Tabs value={subPath}>
                    {tabs.map(tab => {
                        const subPath = tab.link.split("/").pop();
                        return (
                            <TabLink key={tab.text} label={tab.text} to={tab.link} value={subPath}/>
                        );
                    })}
                </Tabs>
            </AppBar>
        )
    }
}

const styles = theme => ({
});

export default withStyles(styles)(Header);