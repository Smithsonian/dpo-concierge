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
import { Redirect } from "react-router-dom";

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

import { Formik, Field } from "formik";
import { TextField } from 'formik-material-ui';

import { defaultView } from "../common/DataTable";

import { PROJECT_VIEW_QUERY } from "./ProjectListView";

////////////////////////////////////////////////////////////////////////////////

const PROJECT_QUERY = gql`
query Project($id: Int!) {
    project(id: $id) {
        id, name, description
    }
}`;

const UPSERT_PROJECT_MUTATION = gql`
mutation UpdateProject($project: ProjectInput!) {
    upsertProject(project: $project) {
        id, name, description
    }
}`;

export interface IProjectEditViewProps
{
    classes: {
        paper: string;
        card: string;
        progress: string;
    }
}

function ProjectEditView(props: IProjectEditViewProps)
{
    const { classes } = props;

    const params = queryString.parse(location.search);
    const id = params.id ? parseInt(params.id as string) : 0;

    let project = { name: "New Project", description: "" };

    const [upsertProjectMutation, { loading: loading1, error: error1, data: data1 }] = useMutation(UPSERT_PROJECT_MUTATION);

    const variables = { id };
    const { loading: loading0, error: error0, data: data0 } = useQuery(PROJECT_QUERY, { variables });

    if (loading0 || loading1) {
        return (<CircularProgress className={classes.progress} />)
    }

    if (error0 || error1) {
        return (<Card raised className={classes.card}>
            <CardContent>
                <Typography variant="h6">Failed to retrieve project</Typography>
                <Typography>{(error0 || error1).message}</Typography>
            </CardContent>
        </Card>)
    }

    if (data0 && data0.project) {
        project = data0.project;
        delete project["__typename"];
    }

    if (data1) {
        return (<Redirect to={"/workflow/projects"} />);
    }

    return (
        <Paper className={classes.paper}>
            <Typography variant="h6">
                Edit Project Details
            </Typography>
            <Formik
                initialValues={project}
                validate={values => {
                    let errors: any = {};
                    if (!values.name) {
                        errors.name = "Can't be empty";
                    }
                    return errors;
                }}
                onSubmit={values => {
                    Object.assign(project, values);
                    upsertProjectMutation({
                        variables: { project },
                        refetchQueries: [{ query: PROJECT_VIEW_QUERY, variables: { view: defaultView } }],
                    });
                }}
            >
                {({ handleSubmit }) => (
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Field
                                    name="name"
                                    label="Name"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Field
                                    name="description"
                                    label="Description"
                                    component={TextField}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                >
                                    Save
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

export default withStyles(styles)(ProjectEditView);