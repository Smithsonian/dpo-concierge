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

import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from "@material-ui/core/Typography";

import DataTable, { ITableColumn } from "../DataTable";

////////////////////////////////////////////////////////////////////////////////

const format = value => value === undefined || value === null ? "" : String(value);

const columns: ITableColumn[] = [
    { id: "object", label: "Object Name", format },
    { id: "unitrecordid", label: "Unit Record ID", format },
    { id: "edanrecordid", label: "EDAN Record ID", format },
    { id: "collectingbody", label: "Collecting Body", format },
    { id: "collection", label: "Collection", format },
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
    { id: "previewlink", label: "Preview Link", format },
    { id: "legacyplayboxid", label: "Legacy Playbox ID", format },
    { id: "legacypreviewlink", label: "Legacy Preview Link", format },
    { id: "shareddrivefolder", label: "Shared Drive Folder", format },
    { id: "mastermodellocation", label: "Master Model Location", format },
    { id: "rawdatasizegb", label: "Raw Data Size (GB)", numeric: true, format },
    { id: "mastermodelsizegb", label: "Master Model Size (GB)", numeric: true, format },
    { id: "notes", label: "Notes", format },
];

const queryMigrationEntries = gql`
{
    migrationEntries(offset: 0, limit: 0) {
        ${columns.map(column => column.id).join(", ")}
    }
}
`;

export interface IMigrationPageProps
{
    classes: {
        root: string;
        paper: string;
    };
}

const styles = theme => ({
    root: {
        width: "100%",
        marginTop: theme.spacing(3),
    },
    paper: {
        width: "100%",
        marginBottom: theme.spacing(2),
    }
});

function MigrationSpreadsheetView(props: IMigrationPageProps)
{
    const { classes } = props;
    const { loading, error, data } = useQuery(queryMigrationEntries);

    if (loading) {
        return (<Paper className={classes.paper}>
            <Typography>Loading data...</Typography>
        </Paper>)
    }

    if (error) {
        return (<Paper className={classes.paper}>
            <Typography>Data query error...</Typography>
        </Paper>)
    }

    const rows = data.migrationEntries;

    return (
        <div className={classes.root}>
            <Paper className={classes.paper}>
                <DataTable
                    rows={rows}
                    columns={columns}
                />
            </Paper>
        </div>
    );
};

export default withStyles(styles)(MigrationSpreadsheetView);