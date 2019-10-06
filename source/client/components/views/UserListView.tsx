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

import { History } from "react-router-dom";

import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, styled, StyleRules } from "@material-ui/core/styles";

import DataTable, { ITableColumn, TableCellFormatter } from "../DataTable";
import CircularProgress from "@material-ui/core/CircularProgress";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";

////////////////////////////////////////////////////////////////////////////////

const columns: ITableColumn[] = [
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
];

const queryUsers = gql`
{
    users(offset: 0, limit: 0) {
        name, email
    }
}
`;

export interface IUserListViewProps
{
    history?: History;
    classes: {
        paper: string;
        card: string;
        progress: string;
    }
}

function UserListView(props: IUserListViewProps)
{
    const { classes, history } = props;
    const { loading, error, data } = useQuery(queryUsers);

    if (loading) {
        return (<CircularProgress className={classes.progress} />)
    }

    if (error) {
        return (<Card raised className={classes.card}>
            <CardContent>
                <Typography variant="h6">Query Error</Typography>
                <Typography>{error.message}</Typography>
            </CardContent>
        </Card>)
    }

    const rows = data.users;

    return (
        <Paper className={classes.paper}>
            <DataTable
                storageKey="admin/users"
                rows={rows}
                columns={columns}
                history={history}
            />
        </Paper>
    );
}

const styles = theme => ({
    paper: {
        alignSelf: "stretch",
    },
    card: {
        maxWidth: 480,
        alignSelf: "center",
    },
    progress: {
        alignSelf: "center"
    },
} as StyleRules);

export default withStyles(styles)(UserListView);