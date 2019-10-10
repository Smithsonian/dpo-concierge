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

import { withStyles, StyleRules } from '@material-ui/core/styles';
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import PersonIcon from "@material-ui/icons/Person";

import { Formik, Field } from "formik";
import { TextField } from 'formik-material-ui';

import { useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";

////////////////////////////////////////////////////////////////////////////////

export interface IRegisterProps
{
    classes: {
        card: string;
        avatar: string;
        form: string;
        submit: string;
    }
}

const INSERT_USER_MUTATION = gql`
mutation InsertUser($user: UserInputSchema!) {
    insertUser(user: $user) {
        id
    }
}
`;

function Register(props: IRegisterProps)
{
    const { classes } = props;

    const [insertUser, { loading, error, data }] = useMutation(INSERT_USER_MUTATION);

    if (error) {
        return (
            <CardContent>
                <Typography variant="h6">Query Error</Typography>
                <Typography>{error.message}</Typography>
            </CardContent>
        );
    }

    if (data) {
        window.location.href = "/workflow/projects";
        return null;
    }

    return (
        <React.Fragment>
            <Avatar className={classes.avatar}>
                <PersonIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
                Sign Up
            </Typography>
            <Formik
                initialValues={{ name: "", email: "", password: "" }}
                validate={values => {
                    let errors: any = {};
                    if (!values.email) {
                        errors.email = "Please enter your email address";
                    }
                    if (!values.password) {
                        errors.password = "Please enter your password";
                    }
                }}
                onSubmit={user => {
                    const variables = { user };
                    insertUser({ variables });
                }}
            >
                {({ handleSubmit}) => (
                    <form className={classes.form} onSubmit={handleSubmit}>
                        <Field
                            name="name"
                            label="Name"
                            required
                            autoFocus
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            component={TextField}
                        />
                        <Field
                            name="email"
                            label="Email Address"
                            autoComplete="email"
                            required
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            component={TextField}
                        />
                        <Field
                            name="password"
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            required
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            component={TextField}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                        >
                            Sign Up
                        </Button>
                    </form>
                )}
            </Formik>
        </React.Fragment>
    );
}

const styles = theme => ({
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
} as StyleRules);

export default withStyles(styles)(Register);