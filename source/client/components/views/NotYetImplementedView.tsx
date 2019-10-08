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

import { withStyles } from '@material-ui/core/styles';
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";

////////////////////////////////////////////////////////////////////////////////

const styles = theme => ({
    card: {
        maxWidth: 480,
        alignSelf: "center",
    },
});

const NotYetImplementedView = props => (
    <Card raised className={props.classes.card}>
        <CardContent>
            <Typography variant="h6">
                Concierge Preview
            </Typography>
            <Typography variant="body1">
                This part of the application hasn't been implemented yet.
            </Typography>
        </CardContent>
    </Card>
);

export default withStyles(styles)(NotYetImplementedView);