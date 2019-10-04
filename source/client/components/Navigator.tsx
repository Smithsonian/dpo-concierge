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

import Hidden from "@material-ui/core/Hidden";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

import HomeIcon from '@material-ui/icons/Home';
import PersonIcon from "@material-ui/icons/Person";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import WorkIcon from "@material-ui/icons/Work";
import FolderIcon from "@material-ui/icons/Folder";
import AirportShuttleIcon from "@material-ui/icons/AirportShuttle";
import SettingsIcon from '@material-ui/icons/Settings';

import { withStyles, makeStyles, Theme } from "@material-ui/core/styles";
import clsx from "clsx";

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
        { name: "Items", icon: <WorkIcon />, active: true },
        { name: "Files", icon: <FolderIcon /> },
    ],
}, {
    name: "Workflow",
    items: [
        { name: "Migration", icon: <AirportShuttleIcon /> },
    ],
}, {
    name: "Administration",
    items: [
        { name: "Users and Roles", icon: <PersonIcon /> },
    ],
}];

const drawerWidth = 256;

const styles: any = theme => ({
    root: {

    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
        // [theme.breakpoints.up('sm')]: {
        //     width: drawerWidth,
        //     flexShrink: 0,
        // },
    }
});

const sidebarStyles: any = theme => ({
    title: {
        paddingTop: theme.spacing(3),
        fontSize: 24,
        color: theme.palette.common.white,
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
        minWidth: 'auto',
        marginRight: theme.spacing(2),
    },
    itemText: {
        fontSize: 'inherit',
    },
    activeItem: {
        color: '#4fc3f7',
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
                Concierge
            </ListItem>
            <Divider className={classes.divider} />

            {categories.map(({ name, items }) => (
                <React.Fragment key={name}>
                    <ListItem className={classes.category}>
                        <ListItemText
                            primary={name}
                        />
                    </ListItem>
                    {items.map(({ name, icon, active }) => (
                        <ListItem
                            key={name}
                            className={clsx(classes.item, active && classes.activeItem)}
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
                    ))}
                    <Divider className={classes.divider} />
                </React.Fragment>
            ))}
        </List>
    );
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

export default withStyles(styles)(Navigator);