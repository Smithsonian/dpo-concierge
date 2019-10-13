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
import clsx from "clsx";

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";

import PlayIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import DataTable, { ITableColumn, TableCellFormatter, formatText, formatDateTime } from "../DataTable";
import ErrorCard from "../ErrorCard";

////////////////////////////////////////////////////////////////////////////////

export const ALL_JOBS_QUERY = gql`
query {
    jobs(offset: 0, limit: 0) {
        id, name, type, state, createdAt, error
    }
}`;

export const RUN_JOB_MUTATION = gql`
mutation RunJob($jobId: Int!) {
    runJob(jobId: $jobId) {
        ok, message
    }
}`;

export const CANCEL_JOB_MUTATION = gql`
mutation CancelJob($jobId: Int!) {
    cancelJob(jobId: $jobId) {
        ok, message
    }
}`;

export const DELETE_JOB_MUTATION = gql`
mutation DeleteJob($jobId: Int!) {
    deleteJob(jobId: $jobId) {
        ok, message
    }
}`;

////////////////////////////////////////////////////////////////////////////////

const CellIconButton = styled(IconButton)({
    margin: "-16px 0",
});

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>
        <CellIconButton onClick={() => {
            const variables = { jobId: row["id"] };
            column.data.runJobMutation({ variables, refetchQueries: [{ query: ALL_JOBS_QUERY }] });
        }} title="Run Job">
            <PlayIcon  fontSize="small" />
        </CellIconButton>
        <CellIconButton onClick={() => {
            const variables = { jobId: row["id"] };
            column.data.cancelJobMutation({ variables, refetchQueries: [{ query: ALL_JOBS_QUERY }] });
        }} title="Cancel Job">
            <StopIcon  fontSize="small" />
        </CellIconButton>
        <CellIconButton onClick={() => {
            if (confirm("Delete job. Are you sure?")) {
                const variables = { jobId: row["id"] };
                column.data.deleteJobMutation({ variables, refetchQueries: [{ query: ALL_JOBS_QUERY }] });
            }
        }} title="Delete Job">
            <DeleteIcon fontSize="small" />
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

export interface IJobListViewProps
{
    classes: {
        paper: string;
        progress: string;
        toolbar: string;
    }
}

function JobListView(props: IJobListViewProps)
{
    const { classes } = props;

    const history = useHistory();

    const { loading, error, data, refetch } = useQuery(ALL_JOBS_QUERY, { errorPolicy: "all" });

    const [ runJobMutation ] = useMutation(RUN_JOB_MUTATION);
    const [ cancelJobMutation ] = useMutation(CANCEL_JOB_MUTATION);
    const [ deleteJobMutation ] = useMutation(DELETE_JOB_MUTATION);

    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
            runJobMutation, cancelJobMutation, deleteJobMutation
        }},
        { id: "createdAt", label: "Created", format: formatDateTime },
        { id: "state", label: "State", format: createLabel, width: 120 },
        { id: "name", label: "Name" },
        { id: "type", label: "Type" },
        { id: "error", label: "Error", format: formatText },
    ];

    if (loading) {
        return (<CircularProgress className={classes.progress} />);
    }
    if (error) {
        return (<ErrorCard title="Query Error" error={error}/>);
    }

    const rows = data.jobs;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Button color="primary" onClick={() => refetch()}>
                    Refresh
                </Button>
            </Toolbar>
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
    progress: {
        alignSelf: "center",
    },
    toolbar: {
        display: "flex",
        justifyContent: "flex-end",
        padding: theme.spacing(1),
        backgroundColor: theme.palette.primary.light,
    },
} as StyleRules);

export default withStyles(styles)(JobListView);