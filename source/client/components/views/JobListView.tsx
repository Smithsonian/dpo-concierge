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

import { useQuery, useMutation, useSubscription } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, StyleRules } from "@material-ui/core/styles";

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";

import PlayIcon from "@material-ui/icons/PlayArrow";
import StopIcon from "@material-ui/icons/Stop";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import { getStorageObject, setStorageObject } from "../../utils/LocalStorage";

import Spacer from "../common/Spacer";
import ErrorCard from "../common/ErrorCard";
import StateBadge from "../common/StateBadge";

import DataTable, {
    ITableColumn,
    TableCellFormatter,
    IDataTableView,
    CellIconButton,
    formatText,
    formatDateTime,
    defaultView,
} from "../common/DataTable";

////////////////////////////////////////////////////////////////////////////////

export const JOB_VIEW_QUERY = gql`
query JobView($view: ViewParameters!) {
    jobView(view: $view) {
        rows {
            id, name, type, state, createdAt, error
        }
        count
    }
}`;

export const JOB_STATE_SUBSCRIPTION = gql`
subscription JobStateChange {
    jobStateChange {
        ok, message
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

const VIEW_STORAGE_KEY = "workflow/jobs/view";

////////////////////////////////////////////////////////////////////////////////

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>

        <CellIconButton title="Run Job" icon={PlayIcon} onClick={() => {
            column.data.runJobMutation({
                variables: { jobId: row["id"] },
                refetchQueries: [ { query: JOB_VIEW_QUERY, variables: column.data.variables }],
            });
        }}/>

        <CellIconButton title="Cancel Job" icon={StopIcon} onClick={() => {
            const variables = { jobId: row["id"] };
            column.data.cancelJobMutation({ variables });
        }}/>

        <CellIconButton title="Delete Job" icon={DeleteIcon} onClick={() => {
            if (confirm("Delete job. Are you sure?")) {
                const variables = { jobId: row["id"] };
                column.data.deleteJobMutation({ variables });
            }
        }}/>
    </div>
);

const createLabel: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
        <StateBadge state={value} />
        {value === "running" ? <CircularProgress size={16}/> : null}
    </div>
);

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

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const variables = { view };
    const queryResult = useQuery(JOB_VIEW_QUERY, { variables, errorPolicy: "all" });

    useSubscription(JOB_STATE_SUBSCRIPTION, { fetchPolicy: "no-cache", shouldResubscribe: true, onSubscriptionData: data => {
        console.log("[Job] state subscription - refetch");
        queryResult.refetch();
    }});

    const [ runJobMutation ] = useMutation(RUN_JOB_MUTATION);
    const [ cancelJobMutation ] = useMutation(CANCEL_JOB_MUTATION);
    const [ deleteJobMutation ] = useMutation(DELETE_JOB_MUTATION);

    if (queryResult.error) {
        return (<ErrorCard title="Query Error" error={queryResult.error}/>);
    }

    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
            runJobMutation, cancelJobMutation, deleteJobMutation, variables
        }},
        { id: "createdAt", label: "Created", format: formatDateTime },
        { id: "state", label: "State", format: createLabel, width: 120 },
        { id: "name", label: "Name" },
        { id: "type", label: "Type" },
        { id: "error", label: "Error", format: formatText },
    ];

    const jobView = queryResult.data && queryResult.data.jobView;
    const rows = jobView ? jobView.rows : [];
    const count = jobView ? jobView.count : 0;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Spacer />
                <Button color="primary" onClick={() => queryResult.refetch()}>
                    Refresh
                </Button>
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
    );
}

const styles = theme => ({
    paper: {
        overflow: "auto",
        alignSelf: "stretch",
    },
    toolbar: {
        display: "flex",
        padding: theme.spacing(1),
        backgroundColor: theme.palette.primary.light,
    },
} as StyleRules);

export default withStyles(styles)(JobListView);