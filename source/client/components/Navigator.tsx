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

import { withStyles } from "@material-ui/core/styles";

import Hidden from "@material-ui/core/Hidden";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Divider from "@material-ui/core/Divider";

import PersonIcon from "@material-ui/icons/Person";
import GroupIcon from "@material-ui/icons/Group";
import AssignmentIcon from "@material-ui/icons/Assignment";
import WorkIcon from "@material-ui/icons/Work";
import AirportShuttleIcon from "@material-ui/icons/AirportShuttle";
import ImportIcon from "@material-ui/icons/Input";

import { ConciergeIcon, BookIcon, CabinetIcon, BoneIcon, FilesIcon, SceneIcon } from "./icons";

////////////////////////////////////////////////////////////////////////////////

export interface INavigatorProps
{
    open: boolean;
    onClose: () => void;

    classes: {
        root: string;
        drawer: string;
    }
}

const categories = [{
    name: "Repository",
    items: [
        { name: "Subjects", icon: <BookIcon />, link: "/repository/subjects" },
        { name: "Items", icon: <BoneIcon />, link: "/repository/items" },
        { name: "Bins", icon: <CabinetIcon />, link: "/repository/bins" },
        { name: "Assets", icon: <FilesIcon />, link: "/repository/assets" },
        { name: "Scenes", icon: <SceneIcon />, link: "/repository/scenes" },
    ],
}, {
    name: "Workflow",
    items: [
        { name: "Projects", icon: <WorkIcon />, link: "/workflow/projects" },
        { name: "Jobs", icon: <AssignmentIcon />, link: "/workflow/jobs" },
        { name: "Ingest", icon: <ImportIcon />, link: "/ingest/start" },
        { name: "Migration", icon: <AirportShuttleIcon />, link: "/migration/spreadsheet" },
    ],
}, {
    name: "Administration",
    items: [
        { name: "Users", icon: <PersonIcon />, link: "/admin/users" },
        { name: "Roles", icon: <GroupIcon />, link: "/admin/roles" },
    ],
}];

function ListItemLink(props) {
    const { to, classes, children } = props;

    const linkRef = React.useMemo(() =>
        React.forwardRef((props, ref) => (
            <NavLink to={to} {...props} innerRef={ref} />
        )), [to]
    );

    return (
        <ListItem
            className={classes.item}
            button
        >
            {children}
        </ListItem>
    );
}

const sidebarStyles: any = theme => ({
    title: {
        paddingTop: theme.spacing(2.5),
        paddingBottom: theme.spacing(2),
        background: "rgba(130,193,255,0.06)",
        color: "rgba(230,242,255,0.8)",
        fontSize: 26,
    },
    titleIcon: {
        marginRight: theme.spacing(1),
        fontSize: 32,
    },
    category: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        color: theme.palette.common.white,
    },
    spaced: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
    },
    item: {
        paddingTop: 1,
        paddingBottom: 1,
        color: 'rgba(255, 255, 255, 0.7)',
        '&:hover,&:focus': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
    },
    itemIcon: {
        minWidth: "auto",
        marginRight: theme.spacing(2),
    },
    itemText: {
        fontSize: 'inherit',
    },
    active: {
        color: "#4fc3f7 !important",
    },
    link: {
        textDecoration: "none",
    },
    divider: {
        marginTop: theme.spacing(2),
    },
});

const Sidebar = withStyles(sidebarStyles)(function(props: any) {
    const { classes } = props;

    return (
        <List disablePadding>
            <ListItem className={classes.title}>
                <ConciergeIcon fontSize="inherit" className={classes.titleIcon} />
                <span>Concierge</span>
            </ListItem>
            <Divider />

            {categories.map(({ name, items }) => (
                <React.Fragment key={name}>
                    <ListItem className={classes.category}>
                        <ListItemText
                            primary={name}
                        />
                    </ListItem>
                    {items.map(({ name, icon, link }) => (
                        <NavLink key={name} to={link} className={classes.link}>
                            <ListItem
                                className={classes.item}
                                button
                            >
                                <ListItemIcon className={classes.itemIcon}>
                                    {icon}
                                </ListItemIcon>
                                <ListItemText
                                    classes={{ primary: classes.itemText }}
                                    primary={name}
                                />
                            </ListItem>
                        </NavLink>
                    ))}
                    <Divider className={classes.divider} />
                </React.Fragment>
            ))}
        </List>
    );
});

////////////////////////////////////////////////////////////////////////////////

const drawerWidth = 200;

const navigatorStyles: any = theme => ({
    root: {

    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    }
});

function Navigator(props: INavigatorProps)
{
    const { classes, open, onClose } = props;

    return (
        <nav className={classes.root}>
            <Hidden smUp implementation="js">
                <Drawer
                    className={classes.drawer}
                    PaperProps={{ style: { width: drawerWidth } }}
                    variant="temporary"
                    open={open}
                    onClose={onClose}
                >
                    <Sidebar/>
                </Drawer>
            </Hidden>
            <Hidden xsDown implementation="css">
                <Drawer
                    className={classes.drawer}
                    PaperProps={{ style: { width: drawerWidth } }}
                    variant="permanent"
                >
                    <Sidebar/>
                </Drawer>
            </Hidden>
        </nav>
    );
}

export default withStyles(navigatorStyles)(Navigator);