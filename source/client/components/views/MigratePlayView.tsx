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

import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { withStyles } from '@material-ui/core/styles';
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
//import TextField from "@material-ui/core/TextField";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";

import { Formik, Field, Form } from "formik";
import { TextField } from 'formik-material-ui';

////////////////////////////////////////////////////////////////////////////////

export interface IMigratePlayViewProps
{
    classes: {
        paper: string;
        progress: string;
        form: string;
        textField: string;
    }
}

const styles = theme => ({
    paper: {
        padding: theme.spacing(3)
    },
    progress: {
        alignSelf: "center"
    },
    form: {

    },
    textField: {

    },
});

function MigratePlayView(props: IMigratePlayViewProps)
{
    const { classes } = props;

    const params = queryString.parse(location.search);

    let entry = null;

    if (params.id) {
        const queryMigrationEntry = gql`{
            migrationEntry(id: "${params.id}") {
                id, object, unitrecordid, edanrecordid, playboxid, shareddrivefolder, mastermodellocation
            }
        }`;

        const { loading, error, data } = useQuery(queryMigrationEntry);

        if (loading) {
            return (<CircularProgress className={classes.progress} />)
        }
        if (error) {
            return (<Card>
                <CardContent>
                    <Typography>Data query error...</Typography>
                </CardContent>
            </Card>)
        }
        if (data) {
            entry = data.migrationEntry;
        }
    }

    const formValues = {
        object: entry ? entry.object : "",
        playboxid: entry ? entry.playboxid : "",
        edanrecordid: entry ? entry.edanrecordid : "",
        shareddrivefolder: entry ? entry.shareddrivefolder : "",
        mastermodelgeometry: entry ? entry.mastermodellocation : "",
        mastermodeltexture: ""
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
                    if (!values.playboxid) {
                        errors.playboxid = "Can't be empty";
                    }
                    return errors;
                }}
                onSubmit={(values, { setSubmitting }) => {
                    console.log(JSON.stringify(values, null, 2));
                    setSubmitting(false);
                }}
            >
                {({ handleSubmit }) => (
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Field
                                    name="object"
                                    label="Object Name"
                                    component={TextField}
                                    className={classes.textField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Field
                                    name="playboxid"
                                    label="Playbox ID"
                                    component={TextField}
                                    className={classes.textField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Field
                                    name="edanrecordid"
                                    label="EDAN Record ID"
                                    component={TextField}
                                    className={classes.textField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    name="shareddrivefolder"
                                    label="Shared Drive Folder"
                                    component={TextField}
                                    className={classes.textField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    name="mastermodelgeometry"
                                    label="Master Model Geometry"
                                    component={TextField}
                                    className={classes.textField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    name="mastermodeltexture"
                                    label="Master Model Texture"
                                    component={TextField}
                                    className={classes.textField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={2}>
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

export default withStyles(styles)(MigratePlayView);