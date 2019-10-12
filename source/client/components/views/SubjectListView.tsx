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

import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, StyleRules } from "@material-ui/core/styles";

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";

import DataTable, { ITableColumn, formatText } from "../DataTable";
import ErrorCard from "../ErrorCard";

////////////////////////////////////////////////////////////////////////////////

export const ALL_SUBJECTS_QUERY = gql`
query {
    subjects(offset: 0, limit: 0) {
        id, name, unitCode, edanRecordId, description
    }
}`;

const columns: ITableColumn[] = [
    { id: "name", label: "Name" },
    { id: "unitCode", label: "Unit", format: formatText },
    { id: "edanRecordId", label: "EDAN Record ID", format: formatText },
    { id: "description", label: "Description", format: formatText },
];

export interface ISubjectListViewProps
{
    classes: {
        progress: string;
        paper: string;
    }
}

function SubjectListView(props: ISubjectListViewProps)
{
    const { classes } = props;
    const history = useHistory();

    const { loading, error, data } = useQuery(ALL_SUBJECTS_QUERY);

    if (loading) {
        return (<CircularProgress className={classes.progress} />);
    }
    if (error) {
        return (<ErrorCard title="Query Error" error={error}/>);
    }

    const rows = data.subjects;

    return (
        <Paper className={classes.paper}>
            <DataTable
                storageKey="repository/subjects"
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

export default withStyles(styles)(SubjectListView);