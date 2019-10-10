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

import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, StyleRules } from "@material-ui/core/styles";

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";

import DataTable, { ITableColumn, TableCellFormatter } from "../DataTable";
import ErrorCard from "../ErrorCard";

////////////////////////////////////////////////////////////////////////////////

export const ALL_ASSETS_QUERY = gql`
query AllAssets($binId: Int) {
    assets(binId: $binId, offset: 0, limit: 0) {
        name
    }
}`;

const columns: ITableColumn[] = [
    { id: "name", label: "Name" },
];

export interface IAssetListViewProps
{
    classes: {
        progress: string;
        paper: string;
    }
}

function AssetListView(props: IAssetListViewProps)
{
    const { classes } = props;
    const { loading, error, data } = useQuery(ALL_ASSETS_QUERY);

    if (loading) {
        return (<CircularProgress className={classes.progress} />);
    }
    if (error) {
        return (<ErrorCard title="Query Error" error={error}/>);
    }

    const rows = data.assets;

    return (
        <Paper className={classes.paper}>
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
} as StyleRules);

export default withStyles(styles)(AssetListView);