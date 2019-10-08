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

import { Link, Route, Switch, History } from "react-router-dom";

import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, styled, StyleRules } from "@material-ui/core/styles";

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";

import EditIcon from "@material-ui/icons/Edit";
import UncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import CheckedIcon from "@material-ui/icons/RadioButtonChecked";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import DataTable, { ITableColumn, TableCellFormatter } from "../DataTable";
import ErrorCard from "../ErrorCard";

import ProjectEditView from "./ProjectEditView";

import { ACTIVE_USER_QUERY } from "../Header";
import { ALL_JOBS_QUERY } from "./JobListView";

////////////////////////////////////////////////////////////////////////////////

export const ALL_PROJECTS_QUERY = gql`
query {
    projects(offset: 0, limit: 0) {
        id, name, description
    }
}`;

const ACTIVATE_PROJECT_MUTATION = gql`
mutation SetActiveProject($id: Int!) {
    setActiveProject(id: $id) {
        id, name, description
    }
}`;

const CellIconButton = styled(IconButton)({
    margin: "-16px 0",
});

const createActions: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>
        <CellIconButton onClick={() => {
            column.data.setActiveProject({
                variables: { id: row["id"] },
                refetchQueries: [
                    { query: ACTIVE_USER_QUERY },
                    { query: ALL_JOBS_QUERY },
                ]
            });
        }}>
            {column.data.activeProjectId === row["id"] ? <CheckedIcon/> : <UncheckedIcon/>}
        </CellIconButton>
        <Link
            to={`projects/edit?id=${encodeURIComponent(row["id"])}`}
            style={{ textDecoration: "none" }}
        >
            <CellIconButton>
                <EditIcon/>
            </CellIconButton>
        </Link>
        <CellIconButton>
            <DeleteIcon/>
        </CellIconButton>
    </div>
);

export interface IProjectListViewProps
{
    history?: History;
    match?: any;

    classes: {
        paper: string;
        progress: string;
        toolbar: string;
    }
}

function ProjectListView(props: IProjectListViewProps)
{
    const { classes, history, match } = props;

    const { data: userData } = useQuery(ACTIVE_USER_QUERY);
    const activeProject = userData && userData.me && userData.me.activeProject;
    const activeProjectId = activeProject && activeProject.id;

    const { loading: loading0, error: error0, data: data0 } = useQuery(ALL_PROJECTS_QUERY);

    const [setActiveProject, { error: error1, data: data1 }] = useMutation(ACTIVATE_PROJECT_MUTATION);

    const columns: ITableColumn[] = [
        { id: "active", label: "Actions", format: createActions, width: 1, data: { setActiveProject, activeProjectId } },
        { id: "name", label: "Name" },
        { id: "description", label: "Description" },
    ];

    if (loading0) {
        return (<CircularProgress className={classes.progress} />)
    }
    if (error0 || error1) {
        return (<ErrorCard title="Query Error" error={error0 || error1}/>);
    }

    const rows = data0.projects;

    return (
        <Switch>
            <Route path={`${match.path}/edit`}>
                <ProjectEditView />
            </Route>

            <Route path={`${match.path}`}>
                <Paper className={classes.paper}>
                    <Toolbar className={classes.toolbar}>
                        <Link to="projects/edit" style={{ textDecoration: "none "}}>
                            <Button color="primary">
                                Create Project
                            </Button>
                        </Link>
                    </Toolbar>
                    <DataTable
                        storageKey="workflow/projects"
                        rows={rows}
                        columns={columns}
                        history={history}
                    />
                </Paper>
            </Route>
        </Switch>
    );
}

const styles = theme => ({
    paper: {
        alignSelf: "stretch",
    },
    progress: {
        alignSelf: "center"
    },
    toolbar: {
        display: "flex",
        justifyContent: "flex-end",
        padding: theme.spacing(1),
    }
} as StyleRules);

export default withStyles(styles)(ProjectListView);