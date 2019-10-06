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

import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, styled, StyleRules } from "@material-ui/core/styles";

import DataTable, { ITableColumn, TableCellFormatter } from "../DataTable";
import CircularProgress from "@material-ui/core/CircularProgress";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import EditIcon from "@material-ui/icons/Edit";
import UncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import CheckedIcon from "@material-ui/icons/RadioButtonChecked";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import ProjectEditView from "./ProjectEditView";

////////////////////////////////////////////////////////////////////////////////

const CellIconButton = styled(IconButton)({
    margin: "-16px 0",
});

const buttons: TableCellFormatter = (value, id, row) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>
        <Link
            to={`projects/edit?id=${encodeURIComponent(row["id"])}`}
            style={{ textDecoration: "none" }}
        >
            <CellIconButton>
                <UncheckedIcon/>
            </CellIconButton>
        </Link>
        <Link
            to={`projects/edit?id=${encodeURIComponent(row["id"])}`}
            style={{ textDecoration: "none" }}
        >
            <CellIconButton>
                <EditIcon/>
            </CellIconButton>
        </Link>
        <Link
            to={`projects/edit?id=${encodeURIComponent(row["id"])}`}
            style={{ textDecoration: "none" }}
        >
            <CellIconButton>
                <DeleteIcon/>
            </CellIconButton>
        </Link>
    </div>
);


const columns: ITableColumn[] = [
    { id: "active", label: "Actions", format: buttons, width: 1 },
    { id: "name", label: "Name" },
    { id: "description", label: "Description" },
];

const QUERY_PROJECTS = gql`
{
    projects(offset: 0, limit: 0) {
        id, name, description
    }
}
`;

export interface IProjectListViewProps
{
    history?: History;
    match?: any;

    classes: {
        paper: string;
        card: string;
        progress: string;
        toolbar: string;
    }
}

function ProjectListView(props: IProjectListViewProps)
{
    const { classes, history, match } = props;
    const { loading, error, data } = useQuery(QUERY_PROJECTS);

    if (loading) {
        return (<CircularProgress className={classes.progress} />)
    }

    if (error) {
        return (<Card raised className={classes.card}>
            <CardContent>
                <Typography variant="h6">Query Error</Typography>
                <Typography>{error.message}</Typography>
            </CardContent>
        </Card>)
    }

    const rows = data.projects;

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
    card: {
        maxWidth: 480,
        alignSelf: "center",
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