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

import Paper from '@material-ui/core/Paper';
import DataTable, { ITableColumn } from "./DataTable";

////////////////////////////////////////////////////////////////////////////////

export interface IMigrationPageProps
{
    classes: {
        paper: string;
        searchBar: string;
        searchInput: string;
        block: string;
        addUser: string;
        contentWrapper: string;
    };
}

class MigrationPage extends React.Component<IMigrationPageProps, {}>
{
    static readonly styles = theme => ({
        paper: {
            width: "100%",
            marginTop: theme.spacing(3),
        }
    });

    componentDidMount()
    {

    }

    render()
    {
        const { classes } = this.props;

        const rows = [
            { one: "Eins", two: "Zwei" },
            { one: "Drei", two: "Vier" },
        ];

        const columns: ITableColumn[] = [
            { id: "one" },
            { id: "two" },
        ];

        return (
            <Paper className={classes.paper}>
                <DataTable
                    rows={rows}
                    columns={columns}
                />
            </Paper>
        );
    }
}

export default withStyles(MigrationPage.styles)(MigrationPage);