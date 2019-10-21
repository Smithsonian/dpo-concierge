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

import { Link, Route, Switch } from "react-router-dom";

import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, styled, StyleRules } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";

import EditIcon from "@material-ui/icons/Edit";
import UncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import CheckedIcon from "@material-ui/icons/RadioButtonChecked";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import { getStorageObject, setStorageObject } from "../../utils/LocalStorage";

import ErrorCard from "../common/ErrorCard";
import Spacer from "../common/Spacer";

import DataTable, {
    IDataTableView,
    ITableColumn,
    TableCellFormatter,
    formatDateTime,
    defaultView,
} from "../common/DataTable";

import ProjectEditView from "./ProjectEditView";

import { ACTIVE_USER_QUERY } from "../Header";
import { JOB_VIEW_QUERY } from "./JobListView";

////////////////////////////////////////////////////////////////////////////////

export const PROJECT_VIEW_QUERY = gql`
query ProjectView($view: ViewParameters!) {
    projectView(view: $view) {
        rows {
            id, name, description, createdAt
        }
        count
    }
}`;

const ACTIVATE_PROJECT_MUTATION = gql`
mutation SetActiveProject($id: Int!) {
    setActiveProject(id: $id) {
        id, name, description
    }
}`;

const VIEW_STORAGE_KEY = "workflow/projects/view";

////////////////////////////////////////////////////////////////////////////////

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
        backgroundColor: theme.palette.primary.light,
    }
} as StyleRules);

const CellIconButton = styled(IconButton)({
    margin: "-16px 0",
});

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>
        <CellIconButton onClick={() => {
            column.data.setActiveProject({
                variables: { id: row["id"] },
                refetchQueries: [
                    { query: ACTIVE_USER_QUERY },
                    { query: JOB_VIEW_QUERY, variables: { view: defaultView } },
                ],
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
    match?: any;

    classes: {
        paper: string;
        progress: string;
        toolbar: string;
    }
}

function ProjectListView(props: IProjectListViewProps)
{
    const { classes, match } = props;

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const { data: userData } = useQuery(ACTIVE_USER_QUERY);
    const activeProject = userData && userData.me && userData.me.activeProject;
    const activeProjectId = activeProject && activeProject.id;

    const variables = { view };
    const queryResult = useQuery(PROJECT_VIEW_QUERY, { variables });
    const [setActiveProject, mutationResult] = useMutation(ACTIVATE_PROJECT_MUTATION);

    const error = queryResult.error || mutationResult.error;
    if (error) {
        return (<ErrorCard title="Query Error" error={error}/>);
    }

    const columns: ITableColumn[] = [
        { id: "_actions", label: "Actions", format: actionButtons, width: 1, data: {
            setActiveProject, activeProjectId
        }},
        { id: "name", label: "Name" },
        { id: "description", label: "Description" },
        { id: "createdAt", label: "Created", format: formatDateTime },
    ];

    const entries = queryResult.data && queryResult.data.projectView;
    const rows = entries ? entries.rows : [];
    const count = entries ? entries.count : 0;

    return (
        <Switch>
            <Route path={`${match.path}/edit`}>
                <ProjectEditView />
            </Route>

            <Route path={`${match.path}`}>
                <Paper className={classes.paper}>
                    <Toolbar className={classes.toolbar}>
                        <Spacer />
                        <Link to="projects/edit" style={{ textDecoration: "none "}}>
                            <Button color="primary">
                                Create Project
                            </Button>
                        </Link>
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
            </Route>
        </Switch>
    );
}

export default withStyles(styles)(ProjectListView);