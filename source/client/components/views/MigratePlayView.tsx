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

import * as queryString from "query-string";

import { useQuery, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles } from '@material-ui/core/styles';
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";

import { Formik, Field } from "formik";
import { TextField, Switch, Select } from 'formik-material-ui';

////////////////////////////////////////////////////////////////////////////////

const QUERY_MIGRATION_SHEET_ENTRY = gql`
query MigrationSheetEntry($id: String!) {
    migrationSheetEntry(id: $id) {
        id, object, unitrecordid, edanrecordid, playboxid, shareddrivefolder, mastermodellocation
    }
}`;

const CREATE_PLAY_MIGRATION_JOB = gql`
mutation CreatePlayMigrationJob($job: PlayMigrationJobInput!) {
    createPlayMigrationJob(playMigrationJob: $job) {
        id
    }
}`;

export interface IMigratePlayViewProps
{
    classes: {
        paper: string;
        card: string;
        progress: string;
    }
}

function MigratePlayView(props: IMigratePlayViewProps)
{
    const { classes } = props;
    const params = queryString.parse(location.search);
    const sheetEntryId = params.id || "";

    const [ createPlayMigrationJob, { error } ] = useMutation(CREATE_PLAY_MIGRATION_JOB);
    if (error) {
        console.warn(error.graphQLErrors);
    }

    let entry = null;

    if (sheetEntryId) {
        const variables = { id: sheetEntryId };
        const { loading, error, data } = useQuery(QUERY_MIGRATION_SHEET_ENTRY, { variables });

        if (loading) {
            return (<CircularProgress className={classes.progress} />)
        }
        if (error) {
            return (<Card raised className={classes.card}>
                <CardContent>
                    <Typography variant="h6">Query Error</Typography>
                    <Typography>{error.message}</Typography>
                    {error.graphQLErrors.map(error => (
                        <Typography>{error.message}</Typography>
                    ))}
                </CardContent>
            </Card>)
        }
        if (data) {
            entry = data.migrationSheetEntry;
        }
    }

    const formValues = {
        name: `Play Scene Migration${entry ? `: #${entry.playboxid}` : ""}${entry && entry.object ? ` - ${entry.object}` : ""}`,
        object: entry ? entry.object : "",
        playboxId: entry ? entry.playboxid : "",
        edanRecordId: entry ? entry.edanrecordid : "",
        sharedDriveFolder: entry ? entry.shareddrivefolder : "",
        masterModelGeometry: entry ? entry.mastermodellocation : "",
        masterModelTexture: "",
        annotationStyle: "Circle",
        migrateAnnotationColor: false,
    };

    return (
        <Paper className={classes.paper}>
            <Typography variant="h6">
                Create Play Scene Migration
            </Typography>
            <Formik
                initialValues={formValues}
                validate={values => {
                    let errors: any = {};
                    if (!values.playboxId) {
                        errors.playboxId = "Can't be empty";
                    }
                    return errors;
                }}
                onSubmit={(values, { setSubmitting }) => {
                    const variables = { job: { ...values, sheetEntryId }};
                    createPlayMigrationJob({ variables });
                    setSubmitting(false);
                    console.log(JSON.stringify(variables, null, 2));
                }}
            >
                {({ handleSubmit }) => (
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Field
                                    name="name"
                                    label="Job Name"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    name="object"
                                    label="Object Name"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Field
                                    name="playboxId"
                                    label="Playbox ID"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Field
                                    name="edanRecordId"
                                    label="EDAN Record ID"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    name="sharedDriveFolder"
                                    label="Shared Drive Folder"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    name="masterModelGeometry"
                                    label="Master Model Geometry"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    name="masterModelTexture"
                                    label="Master Model Texture"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <InputLabel htmlFor="annotationStyle">Annotation Style</InputLabel>
                                <Field
                                    name="annotationStyle"
                                    label="AnnotationStyle"
                                    component={Select}
                                    fullWidth
                                    inputProps={{ id: 'annotationStyle' }}
                                >
                                    <MenuItem value="Circle">Circle</MenuItem>
                                    <MenuItem value="Standard">Standard</MenuItem>
                                    <MenuItem value="Extended">Extended</MenuItem>
                                </Field>
                            </Grid>
                            <Grid item xs={6}>
                                <InputLabel htmlFor="migrateAnnotationColor">Migrate Annotation Color</InputLabel>
                                <Field
                                    name="migrateAnnotationColor"
                                    label="Migrate Annotation Color"
                                    id="migrateAnnotationColor"
                                    component={Switch}
                                />
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                >
                                    Create Migration Job
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                )}
            </Formik>
        </Paper>
    );
}

const styles = theme => ({
    paper: {
        padding: theme.spacing(3)
    },
    card: {
        maxWidth: 480,
        alignSelf: "center",
    },
    progress: {
        alignSelf: "center",
    },
});

export default withStyles(styles)(MigratePlayView);