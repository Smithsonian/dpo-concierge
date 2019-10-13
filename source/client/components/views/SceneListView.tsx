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
import EditIcon from "@material-ui/icons/Edit";
import LaunchIcon from "@material-ui/icons/Launch";

import DataTable, { ITableColumn, TableCellFormatter, CellIconButton } from "../DataTable";
import ErrorCard from "../ErrorCard";

////////////////////////////////////////////////////////////////////////////////

export const FETCH_SCENES_QUERY = gql`
query Scenes($subjectId: Int!, $itemId: Int!, $binId: Int!) {
    scenes(subjectId: $subjectId, itemId: $itemId, binId: $binId, offset: 0, limit: 0) {
        name
        published
        bin {
            uuid
            name
        }
        voyagerDocument {
            filePath
        }
    },
    subject(id: $subjectId) {
        name
    }
    item(id: $itemId) {
        name
    }
    bin(id: $binId) {
        name
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

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>

        <CellIconButton title="Open in Voyager Explorer" icon={ViewIcon} onClick={() => {
            const explorerUrl = "/apps/voyager/voyager-explorer-dev.html";
            const query = `?root=/view/${row["bin"].uuid}/&document=${row["voyagerDocument"].filePath}`;
            window.open(explorerUrl + query, "_blank");
        }}/>

        <CellIconButton title="Edit in Voyager Story" icon={EditIcon} onClick={() => {
            const uuid = row["bin"].uuid;

            column.data.grantAccessMutation({ variables: { uuid } }).then(result => {
                const status = result.data.grantBinAccess;
                if (!status.ok) {
                    return console.warn(status.message);
                }

                const storyUrl = "/apps/voyager/voyager-story-dev.html";
                const href = location.href;
                const referrer = encodeURIComponent(href + (href.includes("?") ? "&" : "?") + `revokeId=${uuid}`);
                const query = `?root=/edit/${uuid}/&document=${row["voyagerDocument"].filePath}&referrer=${referrer}`;
                location.assign(storyUrl + query);
            });
        }}/>

        <CellIconButton title="Publish to API" icon={LaunchIcon} onClick={() => {
            // TODO            
        }}/>
    </div>
);

export interface ISceneListViewProps
{
    classes: {
        progress: string;
        paper: string;
        toolbar: string;
    }
}

function SceneListView(props: ISceneListViewProps)
{
    const { classes } = props;

    const params = queryString.parse(location.search);
    const subjectId = parseInt(params.subjectId as string) || 0;
    const itemId = parseInt(params.itemId as string) || 0;
    const binId = parseInt(params.binId as string) || 0;
    const revokeId = params.revokeId as string;

    const history = useHistory();

    const { loading, error, data } = useQuery(FETCH_SCENES_QUERY, { variables: { subjectId, itemId, binId } });

    const [ grantAccessMutation ] = useMutation(GRANT_ACCESS_MUTATION);
    const [ revokeAccessMutation ] = useMutation(REVOKE_ACCESS_MUTATION);

    const [ revoked, setRevoked ] = React.useState(false);

    if (!revoked && revokeId) {
        revokeAccessMutation({ variables: { uuid: revokeId }}).then(result => {
            const status = result.data.revokeBinAccess;
            if (!status.ok) {
                console.warn(status.message);
            }
        });

        setRevoked(true);
    }

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
    const subject = data.subject;
    const item = data.item;
    const bin = data.bin;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    { item ? `Scenes in item: ${item.name}` :
                        (subject ? `Scenes in subject: ${subject.name}` :
                            (bin ? `Scenes in bin: ${bin.name}` : "All Scenes")) }
                </Typography>
                <div style={{ flex: 1 }}/>
            </Toolbar>
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