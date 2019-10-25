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

import * as queryString from "query-string";

import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, StyleRules } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import { FilesIcon, SceneIcon } from "../icons";

import { getStorageObject, setStorageObject } from "../../utils/LocalStorage";

import SearchInput from "../common/SearchInput";
import Spacer from "../common/Spacer";
import ErrorCard from "../common/ErrorCard";

import DataTable, {
    ITableColumn,
    TableCellFormatter,
    IDataTableView,
    CellIconButton,
    formatDateTime,
    defaultView,
} from "../common/DataTable";

////////////////////////////////////////////////////////////////////////////////

export const BIN_VIEW_QUERY = gql`
query BinView($itemId: Int!, $jobId: Int!, $view: ViewParameters!) {
    binView(itemId: $itemId, jobId: $jobId, view: $view) {
        rows {
            id, name, uuid, version, createdAt
            type {
                name
            }
        }
        count
    }
    item(id: $itemId) {
        name
    }
    job(id: $jobId) {
        name
    }
}`;

export const UPDATE_BIN_MUTATION = gql`
mutation UpdateBin($bin: BinInputSchema) {
    updateBin(bin: $bin) {
        ok, message
    }
}`;

export const DELETE_BIN_MUTATION = gql`
mutation DeleteBin($id: Int!) {
    deleteBin(id: $id) {
        ok, message
    }
}`;

const VIEW_STORAGE_KEY = "repository/bins/view";

////////////////////////////////////////////////////////////////////////////////

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>

        <CellIconButton title="View Asset List" icon={FilesIcon} onClick={() => {
            column.data.history.push(`assets?binId=${row["id"]}`);
        }} />

        <CellIconButton title="View Scene List" icon={SceneIcon} onClick={() => {
            column.data.history.push(`scenes?binId=${row["id"]}`);
        }}/>

        <CellIconButton disabled title="Edit Bin Details" icon={EditIcon} onClick={() => {

        }} />

        <CellIconButton title="Delete Bin and Assets" icon={DeleteIcon} onClick={() => {
            if (confirm(`Delete bin '${row["name"]}' and all assets. Are you sure?`)) {
                column.data.deleteBinMutation({
                    variables: { id: row["id"] },
                    refetchQueries: [ { query: BIN_VIEW_QUERY, variables: column.data.variables }],
                });
            }
        }} />
    </div>
);

export interface IBinListViewProps
{
    classes: {
        progress: string;
        paper: string;
        toolbar: string;
    }
}

function BinListView(props: IBinListViewProps)
{
    const { classes } = props;
    const history = useHistory();

    const params = queryString.parse(location.search);
    const itemId = parseInt(params.itemId as string) || 0;
    const jobId = parseInt(params.jobId as string) || 0;

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const variables = { itemId, jobId, view };
    const queryResult = useQuery(BIN_VIEW_QUERY, { variables });
    const [ deleteBinMutation, deleteResult ] = useMutation(DELETE_BIN_MUTATION);

    if (queryResult.error) {
        return (<ErrorCard title="Query Error" error={queryResult.error}/>);
    }
    const deleteStatus = deleteResult.data && deleteResult.data.deleteBin;
    if (deleteStatus && !deleteStatus.ok) {
        return (<ErrorCard title="Failed to delete bin" error={deleteStatus}/>);
    }

    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
                history, deleteBinMutation, variables,
            }},
        { id: "name", label: "Name" },
        { id: "type", label: "Type", format: value => value.name },
        { id: "uuid", label: "UUID" },
        { id: "version", label: "version" },
        { id: "createdAt", label: "Created", format: formatDateTime },
    ];

    const binView = queryResult.data && queryResult.data.binView;
    const rows = binView ? binView.rows : [];
    const count = binView ? binView.count : 0;
    const item = queryResult.data && queryResult.data.item;
    const job = queryResult.data && queryResult.data.job;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    { item ? `Bins in Item: ${item.name}` : (job ? `Bins in Job: ${job.name}` : "All Bins") }
                </Typography>
                <Spacer />
                <SearchInput
                    search={view.search}
                    onSearchChange={search => {
                        const nextView: IDataTableView = { ...view, page: 0, search };
                        setStorageObject(VIEW_STORAGE_KEY, nextView);
                        setView(nextView);
                    }}
                />
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
    )
}

const styles = theme => ({
    paper: {
        overflow: "auto",
        alignSelf: "stretch",
    },
    toolbar: {
        display: "flex",
        paddingLeft: theme.spacing(2),
        backgroundColor: theme.palette.primary.light,
    },
} as StyleRules);

export default withStyles(styles)(BinListView);