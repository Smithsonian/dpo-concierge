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

import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import { FilesIcon, SceneIcon } from "../icons";


import DataTable, { ITableColumn, TableCellFormatter, CellIconButton, formatText } from "../DataTable";
import ErrorCard from "../ErrorCard";

////////////////////////////////////////////////////////////////////////////////

export const FIND_SUBJECTS_QUERY = gql`
query {
    subjects(offset: 0, limit: 0) {
        id, name, unitCode, edanRecordId, description
    }
}`;

export const DELETE_SUBJECT_MUTATION = gql`
mutation DeleteSubject($subjectId: Int!) {
    deleteSubject(id: $subjectId) {
        ok, message
    }
}`;

////////////////////////////////////////////////////////////////////////////////

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>

        <CellIconButton title="View Item List" icon={FilesIcon} onClick={() => {
            column.data.history.push(`items?subjectId=${row["id"]}`);
        }} />

        <CellIconButton title="View Scene List" icon={SceneIcon} onClick={() => {
            column.data.history.push(`scenes?subjectId=${row["id"]}`);
        }}/>

        <CellIconButton title="Edit Subject Details" icon={EditIcon} onClick={() => {

        }} />

        <CellIconButton title="Delete Subject, Items, Bins, and Assets" icon={DeleteIcon} onClick={() => {
            if (confirm("Delete subject with all items, bins, and assets. Are you sure?")) {
                const variables = { subjectId: row["id"] };
                column.data.deleteSubjectMutation({ variables });
            }
        }} />
    </div>
);

export interface ISubjectListViewProps
{
    classes: {
        progress: string;
        paper: string;
        toolbar: string;
    }
}

function SubjectListView(props: ISubjectListViewProps)
{
    const { classes } = props;
    const history = useHistory();

    const { loading, error, data } = useQuery(FIND_SUBJECTS_QUERY);
    const [ deleteSubjectMutation ] = useMutation(DELETE_SUBJECT_MUTATION);

    if (loading) {
        return (<CircularProgress className={classes.progress} />);
    }
    if (error) {
        return (<ErrorCard title="Query Error" error={error}/>);
    }

    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
                history, deleteSubjectMutation,
        }},
        { id: "name", label: "Name" },
        { id: "unitCode", label: "Unit", format: formatText },
        { id: "edanRecordId", label: "EDAN Record ID", format: formatText },
        { id: "description", label: "Description", format: formatText },
    ];

    const rows = data.subjects;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    All Subjects
                </Typography>
                <div style={{ flex: 1 }}/>
            </Toolbar>
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
    toolbar: {
        display: "flex",
        justifyContent: "flex-end",
        paddingLeft: theme.spacing(2),
        backgroundColor: theme.palette.primary.light,
    },
} as StyleRules);

export default withStyles(styles)(SubjectListView);