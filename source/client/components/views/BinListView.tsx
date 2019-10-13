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

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import { FilesIcon, SceneIcon } from "../icons";

import DataTable, { ITableColumn, TableCellFormatter, CellIconButton } from "../DataTable";
import ErrorCard from "../ErrorCard";

////////////////////////////////////////////////////////////////////////////////

export const FIND_BINS_QUERY = gql`
query FindBins($itemId: Int!, $jobId: Int!) {
    bins(itemId: $itemId, jobId: $jobId, offset: 0, limit: 0) {
        id, name, uuid, version
        type {
            name
        }
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
mutation DeleteBin($binId: Int!) {
    deleteBin(binId: $binId) {
        ok, message
    }
}`;

////////////////////////////////////////////////////////////////////////////////

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>

        <CellIconButton title="View Asset List" icon={FilesIcon} onClick={() => {
            column.data.history.push(`assets?binId=${row["id"]}`);
        }} />

        <CellIconButton title="View Scene List" icon={SceneIcon} onClick={() => {
            column.data.history.push(`scenes?binId=${row["id"]}`);
        }}/>

        <CellIconButton title="Edit Bin Details" icon={EditIcon} onClick={() => {

        }} />

        <CellIconButton title="Delete Bin and Assets" icon={DeleteIcon} onClick={() => {
            if (confirm("Delete bin and all assets. Are you sure?")) {
                const variables = { binId: row["id"] };
                column.data.deleteBinMutation({ variables });
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

    const params = queryString.parse(location.search);
    const itemId = parseInt(params.itemId as string) || 0;
    const jobId = parseInt(params.jobId as string) || 0;

    const history = useHistory();

    const [ deleteBinMutation ] = useMutation(DELETE_BIN_MUTATION);
    const { loading, error, data } = useQuery(FIND_BINS_QUERY, { variables: { itemId, jobId }});

    if (loading) {
        return (<CircularProgress className={classes.progress} />);
    }
    if (error) {
        return (<ErrorCard title="Query Error" error={error}/>);
    }

    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
                history, deleteBinMutation,
            }},
        { id: "name", label: "Name" },
        { id: "type", label: "Type", format: value => value.name },
        { id: "uuid", label: "UUID" },
        { id: "version", label: "version" },
    ];

    const rows = data.bins;
    const item = data.item;
    const job = data.job;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    { item ? `Bins in Item: ${item.name}` : (job ? `Bins in Job: ${job.name}` : "All Bins") }
                </Typography>
                <div style={{ flex: 1 }}/>
            </Toolbar>
            <DataTable
                storageKey="repository/bins"
                rows={rows}
                columns={columns}
                history={history}
            />
        </Paper>
    )
}

const styles = theme => ({
    paper: {
        alignSelf: "stretch",
    },
    progress: {
        alignSelf: "center",
    },
    toolbar: {
        display: "flex",
        justifyContent: "flex-end",
        paddingLeft: theme.spacing(2),
        backgroundColor: theme.palette.primary.light,
    },
} as StyleRules);

export default withStyles(styles)(BinListView);