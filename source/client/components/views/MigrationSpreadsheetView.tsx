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

import { Link, History } from "react-router-dom";

import { useQuery, useMutation, useApolloClient } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles, styled, StyleRules } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Paper from "@material-ui/core/Paper";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

import DataTable, { ITableColumn, TableCellFormatter } from "../DataTable";

////////////////////////////////////////////////////////////////////////////////

const format = value => value === undefined || value === null ? "" : String(value);

const columns: ITableColumn[] = [
    { id: "object", label: "Object Name", format, width: 200 },
    { id: "unitrecordid", label: "Unit Record ID", format, width: 150 },
    { id: "edanrecordid", label: "EDAN Record ID", format, width: 270 },
    { id: "collectingbody", label: "Collecting Body", format },
    { id: "collection", label: "Collection", format, width: 200 },
    { id: "scantype", label: "Scan Type", format },
    { id: "levelofcompletion", label: "Level Of Completion", format },
    { id: "rawdatastatus", label: "Raw Data Status", format },
    { id: "source", label: "Source", format },
    { id: "publiclylisted", label: "Publicly Listed", format },
    { id: "publishstatus", label: "Publish Status", format },
    { id: "rights", label: "Rights", format },
    { id: "partscount", label: "Parts Count", numeric: true, format },
    { id: "articles", label: "Articles", numeric: true, format },
    { id: "annotations", label: "Annotations", numeric: true, format },
    { id: "tours", label: "Tours", numeric: true, format },
    { id: "tourstops", label: "Tour Stops", numeric: true, format },
    { id: "downloads", label: "Downloads", numeric: true, format },
    { id: "playboxid", label: "Playbox ID", numeric: true, format },
    { id: "previewlink", label: "Preview Link", format, width: 200 },
    { id: "legacyplayboxid", label: "Legacy Playbox ID", format },
    { id: "legacypreviewlink", label: "Legacy Preview Link", format, width: 200 },
    { id: "shareddrivefolder", label: "Shared Drive Folder", format, width: 200 },
    { id: "mastermodellocation", label: "Master Model Location", format, width: 200 },
    { id: "rawdatasizegb", label: "Raw Data Size (GB)", numeric: true, format },
    { id: "mastermodelsizegb", label: "Master Model Size (GB)", numeric: true, format },
    { id: "notes", label: "Notes", format, width: 300 },
];

const queryColumns = columns.map(column => column.id).join(", ");

const QUERY_MIGRATION_SHEET_ENTRIES = gql`
{
    migrationSheetEntries(offset: 0, limit: 0) {
        id, ${queryColumns}
    }
}`;

const FETCH_SPREADSHEET_DATA = gql`
mutation {
    updateMigrationSheetEntries(offset: 0, limit: 0) {
        id, ${queryColumns}
    }    
}`;

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
                >
                Migrate Play
                </FlatButton>
            </Link>
        );
    }

    return value === undefined || value === null ? "\u2014" : String(value);
};

columns.unshift({ id: "status", label: "Migration", format: formatStatus, width: 150 });

export interface IMigrationSpreadsheetViewProps
{
    history?: History;

    classes: {
        paper: string;
        card: string;
        progress: string;
        toolbar: string;
    };
}

function MigrationSpreadsheetView(props: IMigrationSpreadsheetViewProps)
{
    const { classes, history } = props;

    const { loading: loading0, error: error0, data: data0, client } = useQuery(QUERY_MIGRATION_SHEET_ENTRIES);
    const [ updateData, { loading: loading1, error: error1, data: data1 }] = useMutation(FETCH_SPREADSHEET_DATA);


    if (loading0 || loading1) {
        return (<CircularProgress className={classes.progress} />)
    }

    if (error0 || error1) {
        const message = error0 ? error0.message : error1.message;
        return (<Card raised className={classes.card}>
            <CardContent>
                <Typography variant="h6">Query Error</Typography>
                <Typography>{message}</Typography>
            </CardContent>
        </Card>)
    }

    let rows;

    if (data1) {
        rows = data1.updateMigrationSheetEntries;

        // update GraphQL cache
        client.writeQuery({
            query: QUERY_MIGRATION_SHEET_ENTRIES,
            data: { migrationSheetEntries: rows },
        });
    }
    else if (data0) {
        rows = data0.migrationSheetEntries;
    }

    return (
        <Paper className={classes.paper}>
            <Toolbar className={classes.toolbar}>
                <Button color="primary" onClick={() => updateData()}>
                    Fetch Spreadsheet Data
                </Button>
            </Toolbar>

            <DataTable
                storageKey="migration/spreadsheet"
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
        alignSelf: "center"
    },
    toolbar: {
        display: "flex",
        justifyContent: "flex-end",
        padding: theme.spacing(1),
    },
} as StyleRules);

export default withStyles(styles)(MigrationSpreadsheetView);