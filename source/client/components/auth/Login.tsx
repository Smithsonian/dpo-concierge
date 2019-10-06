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
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';

import { Formik, Field } from "formik";
import { TextField } from 'formik-material-ui';

////////////////////////////////////////////////////////////////////////////////

export interface ILoginProps
{
    classes: {
        avatar: string;
        form: string;
        submit: string;
    }
}

function Login(props: ILoginProps)
{
    const { classes } = props;

    return (
        <React.Fragment>
            <Avatar className={classes.avatar}>
                <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
                Sign in
            </Typography>
            <Formik
                initialValues={{ email: "", password: "" }}
                validate={values => {
                    let errors: any = {};
                    if (!values.email) {
                        errors.email = "Please enter your email address";
                    }
                    if (!values.password) {
                        errors.password = "Please enter your password";
                    }
                }}
                onSubmit={(values, { setSubmitting }) => {
                    fetch("/login", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(values),
                    }).then(result => {
                        setSubmitting(false);
                        if (result.ok) {
                             window.location.href = "/workflow/projects";
                        }
                    });
                }}
            >
                {({ handleSubmit }) => (
                    <form className={classes.form} onSubmit={handleSubmit}>
                        <Field
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="email"
                            label="Email Address"
                            autoComplete="email"
                            autoFocus
                            component={TextField}

                        />
                        <Field
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            component={TextField}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="primary"
                            className={classes.submit}
                        >
                            Sign In
                        </Button>
                    </form>
                )}
            </Formik>
            <Link href="/register" variant="body2">
                {"Need an account? Sign Up."}
            </Link>
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

export default withStyles(styles)(Login);