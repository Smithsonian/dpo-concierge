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

import { withStyles, StyleRules } from "@material-ui/core/styles";
import clsx from "clsx";

////////////////////////////////////////////////////////////////////////////////

const styles = theme => ({
    root: {
        borderRadius: 3,
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
        padding: 1,
        marginRight: 4,
        flex: 1,
    },
    created: { background: "#b3b337" },
    waiting: { background: "#b38937" },
    running: { background: "#37b34c" },
    done: { background: "#3674b3" },
    error: { background: "#b33737" },
    cancelled: { background: "#8f52cc" },
}) as StyleRules;

const StateBadge = props => (
    <div className={clsx(props.classes.root, props.classes[props.state])}>{props.state}</div>
);

export default withStyles(styles)(StateBadge);