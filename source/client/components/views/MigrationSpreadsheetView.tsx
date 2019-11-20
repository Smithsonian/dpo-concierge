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

import { Link } from "react-router-dom";

import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, styled, StyleRules } from "@material-ui/core/styles";

import CircularProgress from "@material-ui/core/CircularProgress";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import InputIcon from "@material-ui/icons/Input";

import { getStorageObject, setStorageObject } from "../../utils/LocalStorage";

import SearchInput from "../common/SearchInput";
import Spacer from "../common/Spacer";
import ErrorCard from "../common/ErrorCard";

import DataTable, {
    IDataTableView,
    ITableColumn,
    TableCellFormatter,
    defaultView,
    formatText
} from "../common/DataTable";

////////////////////////////////////////////////////////////////////////////////

const columns: ITableColumn[] = [
    { id: "object", label: "Object Name", format: formatText, width: 150 },
    { id: "unitrecordid", label: "Unit Record ID", format: formatText, width: 150 },
    { id: "edanrecordid", label: "EDAN Record ID", format: formatText, width: 270 },
    { id: "collectingbody", label: "Collecting Body", format: formatText },
    { id: "collection", label: "Collection", format: formatText, width: 200 },
    { id: "scantype", label: "Scan Type", format: formatText },
    { id: "levelofcompletion", label: "Level Of Completion", format: formatText },
    { id: "rawdatastatus", label: "Raw Data Status", format: formatText },
    { id: "source", label: "Source", format: formatText },
    { id: "publiclylisted", label: "Publicly Listed", format: formatText },
    { id: "publishstatus", label: "Publish Status", format: formatText },
    { id: "rights", label: "Rights", format: formatText },
    { id: "partscount", label: "Parts Count", numeric: true, format: formatText },
    { id: "articles", label: "Articles", numeric: true, format: formatText },
    { id: "annotations", label: "Annotations", numeric: true, format: formatText },
    { id: "tours", label: "Tours", numeric: true, format: formatText },
    { id: "tourstops", label: "Tour Stops", numeric: true, format: formatText },
    { id: "downloads", label: "Downloads", numeric: true, format: formatText },
    { id: "playboxid", label: "Playbox ID", numeric: true, format: formatText },
    { id: "previewlink", label: "Preview Link", format: formatText, width: 200 },
    { id: "legacyplayboxid", label: "Legacy Playbox ID", format: formatText },
    { id: "legacypreviewlink", label: "Legacy Preview Link", format: formatText, width: 200 },
    { id: "mastermodelgeometryfile", label: "Master Geometry File", format: formatText, width: 200 },
    { id: "mastermodeltexturefile", label: "Master Texture File", format: formatText, width: 200 },
    { id: "rawdatasizegb", label: "Raw Data Size (GB)", numeric: true, format: formatText },
    { id: "mastermodelsizegb", label: "Master Model Size (GB)", numeric: true, format: formatText },
    { id: "notes", label: "Notes", format: formatText, width: 300 },
];

const queryColumns = columns.map(column => column.id).join(", ");

////////////////////////////////////////////////////////////////////////////////

const SHEET_VIEW_QUERY = gql`
query MigrationSheetView($view: ViewParameters!) {
    migrationSheetView(view: $view) {
        rows {
            id, ${queryColumns}
        }
        count
    }
}`;

const FETCH_SHEET_MUTATION = gql`
mutation FetchMigrationSheet {
    fetchMigrationSheet {
        ok, message
    }    
}`;

const VIEW_STORAGE_KEY = "migration/sheet/view";

////////////////////////////////////////////////////////////////////////////////

const FlatButton = styled(Button)({
    margin: "-16px 0",
    padding: "2px 8px 0 8px"
});

const formatStatus: TableCellFormatter = (value, row, column) => {
    if (!value && row["playboxid"]) {
        return (
            <Link
                style={{ textDecoration: "none "}}
                to={`/migration/play?id=${encodeURIComponent(row["id"])}`}>
                <FlatButton
                    variant="contained"
                    color="primary"
                    style={{ minWidth: 150 }}
                >
                Migrate Play
                </FlatButton>
            </Link>
        );
    }

    return value === undefined || value === null ? "\u2014" : String(value);
};

columns.unshift({ id: "_actions", label: "Actions", format: formatStatus });

export interface IMigrationSpreadsheetViewProps
{
    classes: {
        paper: string;
        card: string;
        progress: string;
        toolbar: string;
    };
}

function MigrationSpreadsheetView(props: IMigrationSpreadsheetViewProps)
{
    const { classes } = props;

    const initialView: IDataTableView = getStorageObject(VIEW_STORAGE_KEY, defaultView);
    const [ view, setView ] = React.useState(initialView);

    const variables = { view };
    const queryResult = useQuery(SHEET_VIEW_QUERY, { variables });
    const [ updateData, updateResult ] = useMutation(FETCH_SHEET_MUTATION);

    const error = queryResult.error || updateResult.error;
    if (error) {
        return (<ErrorCard title="Query Error" error={error} />);
    }

    const status = updateResult.data && updateResult.data.fetchMigrationSheet;
    if (status && !status.ok) {
        return (<ErrorCard title="Failed to fetch spreadsheet" error={status} />);
    }

    if (updateResult.loading) {
        return (<CircularProgress className={classes.progress} />);
    }

    const entries = queryResult.data && queryResult.data.migrationSheetView;
    const rows = entries ? entries.rows : [];
    const count = entries ? entries.count : 0;

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <SearchInput
                    search={view.search}
                    onSearchChange={search => {
                        const nextView: IDataTableView = { ...view, page: 0, search };
                        setStorageObject(VIEW_STORAGE_KEY, nextView);
                        setView(nextView);
                    }} />
                <Spacer/>
                <Button color="primary" onClick={() => updateData({ variables })}>
                    <InputIcon style={{ marginRight: 8 }} />
                    <span>Fetch Spreadsheet</span>
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
    progress: {
        alignSelf: "center",
    },
} as StyleRules);

export default withStyles(styles)(MigrationSpreadsheetView);