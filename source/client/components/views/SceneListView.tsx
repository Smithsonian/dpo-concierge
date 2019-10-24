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
import EditIcon from "@material-ui/icons/Edit";
import LaunchIcon from "@material-ui/icons/Launch";

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

export const SCENE_VIEW_QUERY = gql`
query SceneView($subjectId: Int!, $itemId: Int!, $binId: Int!, $view: ViewParameters!) {
    sceneView(subjectId: $subjectId, itemId: $itemId, binId: $binId, view: $view) {
        rows {
            id, name, published, createdAt
            bin {
                uuid
                name
            }
            voyagerDocument {
                filePath
            }
        }
        count
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

export const PUBLISH_SCENE_MUTATION = gql`
mutation PublishScene($id: Int!) {
    publishScene(id: $id) {
        ok, message
    }
}`;

const VIEW_STORAGE_KEY = "repository/scenes/view";

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
            const id = row["id"];
            column.data.publishSceneMutation({
                variables: { id },
                refetchQueries: [ { query: SCENE_VIEW_QUERY, variables: column.data.variables }],
            });
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
    const history = useHistory();

    const params = queryString.parse(location.search);
    const subjectId = parseInt(params.subjectId as string) || 0;
    const itemId = parseInt(params.itemId as string) || 0;
    const binId = parseInt(params.binId as string) || 0;
    const revokeId = params.revokeId as string;

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const variables = { view, subjectId, itemId, binId };
    const queryResult = useQuery(SCENE_VIEW_QUERY, { variables });

    const [ grantAccessMutation ] = useMutation(GRANT_ACCESS_MUTATION);
    const [ revokeAccessMutation ] = useMutation(REVOKE_ACCESS_MUTATION);
    const [ publishSceneMutation, { data: publishData } ] = useMutation(PUBLISH_SCENE_MUTATION);

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

    if (queryResult.error) {
        return (<ErrorCard title="Query Error" error={queryResult.error}/>);
    }

    const publishStatus = publishData && publishData.publishScene;
    if (publishStatus && !publishStatus.ok) {
        return (<ErrorCard title="Failed to publish" error={publishStatus}/>);
    }

    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
            grantAccessMutation, revokeAccessMutation, publishSceneMutation, variables
        }},
        { id: "name", label: "Name" },
        //{ id: "bin", label: "Bin", format: bin => bin.name },
        { id: "voyagerDocument", label: "Voyager Document", format: asset => asset.filePath },
        { id: "published", label: "Published" },
        { id: "createdAt", label: "Created", format: formatDateTime },
    ];

    const sceneView = queryResult.data && queryResult.data.sceneView;
    const rows = sceneView ? sceneView.rows : [];
    const count = sceneView ? sceneView.count : 0;

    const subject = queryResult.data && queryResult.data.subject;
    const item = queryResult.data && queryResult.data.item;
    const bin = queryResult.data && queryResult.data.bin;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    { item ? `Scenes in item: ${item.name}` :
                        (subject ? `Scenes in subject: ${subject.name}` :
                            (bin ? `Scenes in bin: ${bin.name}` : "All Scenes")) }
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
    }
} as StyleRules);

export default withStyles(styles)(SceneListView);
