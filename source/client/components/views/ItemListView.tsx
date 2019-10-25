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

import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/DeleteForever";

import { FilesIcon, SceneIcon, CabinetIcon } from "../icons";

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

export const ITEM_VIEW_QUERY = gql`
query ItemView($subjectId: Int!, $view: ViewParameters!) {
    itemView(subjectId: $subjectId, view: $view) {
        rows {
            id, name, description
            subject {
                name
            }
        }
        count
    }
    subject(id: $subjectId) {
        name
    }
}`;

export const UPDATE_ITEM_MUTATION = gql`
mutation UpdateItem($item: ItemInputSchema) {
    updateBin(item: $item) {
        ok, message
    }
}`;

export const DELETE_ITEM_MUTATION = gql`
mutation DeleteItem($id: Int!) {
    deleteItem(id: $id) {
        ok, message
    }
}`;

const VIEW_STORAGE_KEY = "repository/items/view";

////////////////////////////////////////////////////////////////////////////////

const actionButtons: TableCellFormatter = (value, row, column) => (
    <div style={{ display: "flex", flexWrap: "nowrap" }}>

        <CellIconButton title="View Bin List" icon={CabinetIcon} onClick={() => {
            column.data.history.push(`bins?itemId=${row["id"]}`);
        }} />

        <CellIconButton title="View Scene List" icon={SceneIcon} onClick={() => {
            column.data.history.push(`scenes?itemId=${row["id"]}`);
        }}/>

        <CellIconButton disabled title="Edit Item Details" icon={EditIcon} onClick={() => {

        }} />

        <CellIconButton disabled  title="Delete Item, Bins, and Assets" icon={DeleteIcon} onClick={() => {
            if (confirm(`Delete item '${row["name"]}' with all bins and assets. Are you sure?`)) {
                column.data.deleteItemMutation({
                    variables: { id: row["id"] },
                    refetchQueries: [ { query: ITEM_VIEW_QUERY, variables: column.data.variables }],
                });
            }
        }} />
    </div>
);

export interface IItemListViewProps
{
    classes: {
        progress: string;
        paper: string;
        toolbar: string;
    }
}

function ItemListView(props: IItemListViewProps)
{
    const { classes } = props;
    const history = useHistory();

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const params = queryString.parse(location.search);
    const subjectId = parseInt(params.subjectId as string) || 0;

    const variables = { view, subjectId };
    const queryResult = useQuery(ITEM_VIEW_QUERY, { variables });
    const [ deleteItemMutation, deleteResult ] = useMutation(DELETE_ITEM_MUTATION);

    if (queryResult.error) {
        return (<ErrorCard title="Query Error" error={queryResult.error}/>);
    }
    const deleteStatus = deleteResult.data && deleteResult.data.deleteItem;
    if (deleteStatus && !deleteStatus.ok) {
        return (<ErrorCard title="Failed to delete item" error={deleteStatus}/>);
    }


    const columns: ITableColumn[] = [
        { id: "actions", label: "Actions", format: actionButtons, width: 1, data: {
            history, deleteItemMutation, variables,
        }},
        { id: "name", label: "Name" },
        { id: "description", label: "Description", format: formatText },
        { id: "subject", label: "Subject", format: subject => subject.name },
    ];

    const itemView = queryResult.data && queryResult.data.itemView;
    const rows = itemView ? itemView.rows : [];
    const count = itemView ? itemView.count : 0;
    const subject = queryResult.data && queryResult.data.subject;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Typography variant="subtitle2">
                    { subject ? `Items in Subject: ${subject.name}` : "All Items" }
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
    },
} as StyleRules);

export default withStyles(styles)(ItemListView);