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

import { useHistory } from "react-router-dom";

import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, StyleRules } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import { getStorageObject, setStorageObject } from "../../utils/LocalStorage";

import Spacer from "../common/Spacer";
import ErrorCard from "../common/ErrorCard";

import DataTable, {
    ITableColumn,
    TableCellFormatter,
    IDataTableView,
    formatDateTime,
    defaultView
} from "../common/DataTable";

////////////////////////////////////////////////////////////////////////////////

const USER_VIEW_QUERY = gql`
query UserView($view: ViewParameters!) {
    userView(view: $view) {
        rows {
            id, name, email, createdAt
            role {
                name
            }
        }
        count
    }
}`;

const VIEW_STORAGE_KEY = "administration/users/view";

////////////////////////////////////////////////////////////////////////////////

export interface IUserListViewProps
{
    classes: {
        paper: string;
        toolbar: string;
    }
}

function UserListView(props: IUserListViewProps)
{
    const { classes } = props;
    const history = useHistory();

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const variables = { view };
    const queryResult = useQuery(USER_VIEW_QUERY, { variables });

    if (queryResult.error) {
        return (<ErrorCard title="Query Error" error={queryResult.error}/>);
    }

    const columns: ITableColumn[] = [
        { id: "name", label: "Name" },
        { id: "email", label: "Email" },
        { id: "role", label: "Role", format: role => role.name },
        { id: "createdAt", label: "Created", format: formatDateTime },
    ];

    const userView = queryResult.data && queryResult.data.userView;
    const rows = userView ? userView.rows : [];
    const count = userView ? userView.count : 0;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    All Users
                </Typography>
                <Spacer />
            </Toolbar>
            <DataTable
                loading={queryResult.loading}
                rows={rows}
                columns={columns}
                count={count}
                view={view}
                onViewChange={view => {
                    setStorageObject(VIEW_STORAGE_KEY, view);
                    setView(view);
                }}
            />
        </Paper>
    );
}

const styles = theme => ({
    paper: {
        overflow: "auto",
        alignSelf: "stretch",
    },
    toolbar: {
        display: "flex",
        padding: theme.spacing(1),
        backgroundColor: theme.palette.primary.light,
    },
} as StyleRules);

export default withStyles(styles)(UserListView);