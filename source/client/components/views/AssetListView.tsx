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

import ViewIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import DataTable, { ITableColumn, TableCellFormatter, CellIconButton, formatDateTime } from "../DataTable";
import ErrorCard from "../ErrorCard";

////////////////////////////////////////////////////////////////////////////////

export const FIND_ASSETS_QUERY = gql`
query FindAssets($binId: Int!) {
    assets(binId: $binId, offset: 0, limit: 0) {
        binUuid, filePath, path, name, mimeType, createdAt
    }
    bin(id: $binId) {
        name
    }
}`;

export const DELETE_ASSET_MUTATION = gql`
mutation DeleteAsset($assetId: Int!) {
    deleteAsset(assetId: $assetId) {
        ok, message
    }
}`;

////////////////////////////////////////////////////////////////////////////////

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>

        <CellIconButton title="View Asset" icon={ViewIcon} onClick={() => {
            window.open(`/view/${row["binUuid"]}/${row["filePath"]}`, "_blank");
        }}/>

        <CellIconButton title="Delete Asset" icon={DeleteIcon} onClick={() => {
            if (confirm("Delete asset. Are you sure?")) {
                const variables = { assetId: row["id"] };
                column.data.deleteAssetMutation({ variables });
            }
        }} />

    </div>
);

export interface IAssetListViewProps
{
    classes: {
        progress: string;
        paper: string;
        toolbar: string;
    }
}

function AssetListView(props: IAssetListViewProps)
{
    const { classes } = props;

    const params = queryString.parse(location.search);
    const binId = parseInt(params.binId as string) || 0;

    const history = useHistory();

    const [ deleteAssetMutation ] = useMutation(DELETE_ASSET_MUTATION);
    const { loading, error, data } = useQuery(FIND_ASSETS_QUERY, { variables: { binId }});

    if (loading) {
        return (<CircularProgress className={classes.progress} />);
    }
    if (error) {
        return (<ErrorCard title="Query Error" error={error}/>);
    }

    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
            history, deleteAssetMutation,
        }},
        { id: "name", label: "Name" },
        { id: "path", label: "Path" },
        { id: "mimeType", label: "Type" },
        { id: "createdAt", label: "Created", format: formatDateTime },
    ];

    const rows = data.assets;
    const bin = data.bin;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    { bin ? `Assets in Bin: ${bin.name}` : "All Assets" }
                </Typography>
                <div style={{ flex: 1 }}/>
            </Toolbar>
            <DataTable
                storageKey="repository/assets"
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

export default withStyles(styles)(AssetListView);