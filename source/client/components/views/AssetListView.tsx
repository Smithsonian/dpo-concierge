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

import ViewIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/DeleteForever";

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
    defaultView
} from "../common/DataTable";

////////////////////////////////////////////////////////////////////////////////

export const ASSET_VIEW_QUERY = gql`
query AssetView($binId: Int!, $view: ViewParameters!) {
    assetView(binId: $binId, view: $view) {
        rows {
            id, binUuid, filePath, path, name, mimeType, createdAt
        }
        count
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

const VIEW_STORAGE_KEY = "repository/assets/view";

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
    const history = useHistory();

    const params = queryString.parse(location.search);
    const binId = parseInt(params.binId as string) || 0;

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const variables = { view, binId };
    const queryResult = useQuery(ASSET_VIEW_QUERY, { variables });
    const [ deleteAssetMutation ] = useMutation(DELETE_ASSET_MUTATION);

    if (queryResult.error) {
        return (<ErrorCard title="Query Error" error={queryResult.error}/>);
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

    const assetView = queryResult.data && queryResult.data.assetView;
    const rows = assetView ? assetView.rows : [];
    const count = assetView ? assetView.count : 0;
    const bin = queryResult.data && queryResult.data.bin;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    { bin ? `Assets in Bin: ${bin.name}` : "All Assets" }
                </Typography>
                <Spacer />
                <SearchInput
                    search={view.search}
                    onSearchChange={search => {
                        const nextView = { ...view, search };
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

export default withStyles(styles)(AssetListView);