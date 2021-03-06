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

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";

import { ConciergeIcon } from "../icons";

////////////////////////////////////////////////////////////////////////////////

const styles = theme => ({
    card: {
        maxWidth: 360,
        alignSelf: "center",
        textAlign: "center",
    },
} as StyleRules);

const NotYetImplementedView = props => (
    <Card raised className={props.classes.card}>
        <CardContent>
            <Typography variant="h4">
                Oh no!
            </Typography>
        </CardContent>
        <CardContent>
            <Typography variant="body1">
                The Concierge is so sorry, but this service is not yet available. Please come back soon!
            </Typography>
        </CardContent>
        <CardContent>
            <ConciergeIcon color="primary" style={{ fontSize: 32 }} />
        </CardContent>
    </Card>
);

export default withStyles(styles)(NotYetImplementedView);