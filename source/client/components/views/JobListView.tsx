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

import { History } from "react-router-dom";

import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, styled, StyleRules } from "@material-ui/core/styles";
import clsx from "clsx";

import CircularProgress from "@material-ui/core/CircularProgress";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";

import PlayIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import DataTable, { ITableColumn, TableCellFormatter } from "../DataTable";

////////////////////////////////////////////////////////////////////////////////

const CellIconButton = styled(IconButton)({
    margin: "-16px 0",
});

const createActions: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>
        <CellIconButton>
            <PlayIcon/>
        </CellIconButton>
        <CellIconButton>
            <StopIcon/>
        </CellIconButton>
        <CellIconButton>
            <DeleteIcon/>
        </CellIconButton>
    </div>
);

const StateBadge = withStyles(theme => ({
    root: { borderRadius: 3, color: "white", fontWeight: "bold", textAlign: "center", padding: 1 },
    created: { background: "#b3b337" },
    waiting: { background: "#b38937" },
    running: { background: "#37b34c" },
    done: { background: "#3674b3" },
    error: { background: "#b33737" },
    cancelled: { background: "#8f52cc" },
}))((props: any) => (
    <div className={clsx(props.classes.root, props.classes[props.state])}>{props.state}</div>)
);

const createLabel: TableCellFormatter = (value, row, column) => (<StateBadge state={value} />);

const formatText: TableCellFormatter = value => value === undefined || value === null ? "" : String(value);

const columns: ITableColumn[] = [
    { id: "actions", label: "Actions", format: createActions, width: 1 },
    { id: "state", label: "State", format: createLabel, width: 120 },
    { id: "name", label: "Name" },
    { id: "type", label: "Type" },
    { id: "error", label: "Error", format: formatText },
];

const queryJobs = gql`
{
    jobs(offset: 0, limit: 0) {
        name, type, state, error
    }
}
`;

export interface IJobListViewProps
{
    history?: History;
    classes: {
        paper: string;
        card: string;
        progress: string;
    }
}

function JobListView(props: IJobListViewProps)
{
    const { classes, history } = props;
    const { loading, error, data } = useQuery(queryJobs);

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

    const rows = data.jobs;

    return (
        <Paper className={classes.paper}>
            <DataTable
                storageKey="workflow/jobs"
                rows={rows}
                columns={columns}
                history={history}
            />
        </Paper>
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
        alignSelf: "center",
    },
} as StyleRules);

export default withStyles(styles)(JobListView);