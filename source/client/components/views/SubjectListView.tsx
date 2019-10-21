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

import { withStyles, StyleRules } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import { FilesIcon, SceneIcon } from "../icons";

import { getStorageObject, setStorageObject } from "../../utils/LocalStorage";

import SearchInput from "../common/SearchInput";
import Spacer from "../common/Spacer";
import ErrorCard from "../common/ErrorCard";

import DataTable, {
    ITableColumn,
    TableCellFormatter,
    IDataTableView,
    CellIconButton,
    formatText,
    defaultView,
} from "../common/DataTable";

////////////////////////////////////////////////////////////////////////////////

export const SUBJECT_VIEW_QUERY = gql`
query SubjectView($view: ViewParameters!) {
    subjectView(view: $view) {
        rows {
            id, name, unitCode, edanRecordId, description
        }
        count
    }
}`;

export const DELETE_SUBJECT_MUTATION = gql`
mutation DeleteSubject($subjectId: Int!) {
    deleteSubject(id: $subjectId) {
        ok, message
    }
}`;

const VIEW_STORAGE_KEY = "repository/subjects/view";

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

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const variables = { view };
    const queryResult = useQuery(SUBJECT_VIEW_QUERY, { variables });
    const [ deleteSubjectMutation ] = useMutation(DELETE_SUBJECT_MUTATION);

    if (queryResult.error) {
        return (<ErrorCard title="Query Error" error={queryResult.error}/>);
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

    const subjectView = queryResult.data && queryResult.data.subjectView;
    const rows = subjectView ? subjectView.rows : [];
    const count = subjectView ? subjectView.count : 0;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    All Subjects
                </Typography>
                <Spacer/>
                <SearchInput
                    search={view.search}
                    onSearchChange={search => {
                        const nextView = { ...view, search };
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
    },
} as StyleRules);

export default withStyles(styles)(SubjectListView);