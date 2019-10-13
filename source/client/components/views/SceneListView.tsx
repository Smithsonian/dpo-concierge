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

import { withStyles, styled, StyleRules } from "@material-ui/core/styles";

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";

import ViewIcon from "@material-ui/icons/Visibility";
import EditIcon from "@material-ui/icons/Edit";
import LaunchIcon from "@material-ui/icons/Launch";

import DataTable, { ITableColumn, TableCellFormatter } from "../DataTable";
import ErrorCard from "../ErrorCard";

////////////////////////////////////////////////////////////////////////////////

export const ALL_SCENES_QUERY = gql`
query AllScenes($itemId: Int) {
    scenes(itemId: $itemId, offset: 0, limit: 0) {
        name
        published
        bin {
            uuid
            name
        }
        voyagerDocument {
            filePath
        }
    }
}`;

export const GRANT_ACCESS_MUTATION = gql`
mutation GrantBinAccess($uuid: String!) {
    grantBinAccess(uuid: $uuid) {
        ok, message
    }
}`;

export const REVOKE_ACCESS_MUTATION = gql`
mutation RevokeBinAccess($uuid: String!) {
    revokeBinAccess(uuid: $uuid) {
        ok, message
    }
}`;

////////////////////////////////////////////////////////////////////////////////

const CellIconButton = styled(IconButton)({
    margin: "-16px 0",
});

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>
        <Tooltip title="Open in Voyager Explorer">
            <CellIconButton onClick={() => {
                window.open(`/apps/voyager/voyager-explorer-dev.html?root=/view/${row["bin"].uuid}/&document=${row["voyagerDocument"].filePath}`, "_blank");
            }}>
                <ViewIcon fontSize="small" />
            </CellIconButton>
        </Tooltip>
        <Tooltip title="Edit in Voyager Story">
            <CellIconButton onClick={() => {
                const variables = { uuid: row["bin"].uuid };
                column.data.grantAccessMutation({ variables }).then(result => {
                    const status = result.data.grantBinAccess;
                    if (!status.ok) {
                        return console.warn(status);
                    }
                    window.open(`/apps/voyager/voyager-story-dev.html?root=/edit/${row["bin"].uuid}/&document=${row["voyagerDocument"].filePath}`, "_blank")
                });
            }}>
                <EditIcon fontSize="small" />
            </CellIconButton>
        </Tooltip>
        <Tooltip title="Publish to API">
            <CellIconButton onClick={() => {
                // TODO
            }}>
                <LaunchIcon fontSize="small" />
            </CellIconButton>
        </Tooltip>
    </div>
);

export interface ISceneListViewProps
{
    classes: {
        progress: string;
        paper: string;
    }
}

function SceneListView(props: ISceneListViewProps)
{
    const { classes } = props;
    const history = useHistory();

    const { loading, error, data } = useQuery(ALL_SCENES_QUERY);

    const [ grantAccessMutation ] = useMutation(GRANT_ACCESS_MUTATION);
    const [ revokeAccessMutation ] = useMutation(REVOKE_ACCESS_MUTATION);

    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
            grantAccessMutation, revokeAccessMutation,
        }},
        { id: "name", label: "Name" },
        //{ id: "bin", label: "Bin", format: bin => bin.name },
        { id: "voyagerDocument", label: "Voyager Document", format: asset => asset.filePath },
        { id: "published", label: "Published" },
    ];

    if (loading) {
        return (<CircularProgress className={classes.progress} />);
    }
    if (error) {
        return (<ErrorCard title="Query Error" error={error}/>);
    }

    const rows = data.scenes;

    return (
        <Paper className={classes.paper}>
            <DataTable
                storageKey="repository/scenes"
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
        padding: theme.spacing(1),
        backgroundColor: theme.palette.primary.light,
    }
} as StyleRules);

export default withStyles(styles)(SceneListView);