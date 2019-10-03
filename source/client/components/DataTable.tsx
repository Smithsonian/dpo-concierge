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

import { withStyles, Theme } from "@material-ui/core/styles";

import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import TablePagination from "@material-ui/core/TablePagination";

////////////////////////////////////////////////////////////////////////////////

export interface ITableColumn
{
    id: string;
    label?: string;
    numeric?: boolean;
    format?: (value: any) => string;
}

export interface IDataTableProps<T>
{
    rows: T[];
    columns: ITableColumn[];

    classes: {
        root: string;
        table: string;
        tableWrapper: string;
    }
}

export interface IDataTableState
{
    order: "asc" | "desc";
    orderBy: string;
    page: number;
    rowsPerPage: number;
}

class DataTable<T extends {}> extends React.Component<IDataTableProps<T>, IDataTableState>
{
    static readonly styles: any = theme => ({
        table: {
            minWidth: 750,
        },
        tableWrapper: {
            overflowX: "auto",
        },
    });

    constructor(props: IDataTableProps<T>)
    {
        super(props);
        
        this.onClickColumnSort = this.onClickColumnSort.bind(this);
        this.onChangePage = this.onChangePage.bind(this);
        this.onChangeRowsPerPage = this.onChangeRowsPerPage.bind(this);

        this.state = {
            order: "asc",
            orderBy: "",
            page: 0,
            rowsPerPage: 10
        };
    }

    render()
    {
        const { rows, classes } = this.props;
        const { rowsPerPage, page } = this.state;

        return (
            <React.Fragment>
                <div className={classes.tableWrapper}>
                    <Table className={classes.table}>
                        <TableHead>
                            {this.renderHeadRow()}
                        </TableHead>
                        <TableBody>
                            {this.getDisplayRows().map((row, index) => this.renderRow(row))}
                        </TableBody>
                    </Table>
                </div>
                <TablePagination
                    component="div"
                    rowsPerPageOptions={[ 10, 20, 50, 100 ]}
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={this.onChangePage}
                    onChangeRowsPerPage={this.onChangeRowsPerPage}
                />
            </React.Fragment>
        );
    }

    protected renderHeadRow()
    {
        const { columns } = this.props;
        const { orderBy, order } = this.state;

        return(
            <TableRow>
                {columns.map(column => (
                    <TableCell
                        key={column.id}
                        align={column.numeric ? "right" : "left"}
                        sortDirection={orderBy === column.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === column.id}
                            direction={order}
                            onClick={() => this.onClickColumnSort(column.id)}
                        >
                            {column.label || column.id}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        );
    }

    protected renderRow(row: [ T, number ])
    {
        const { columns } = this.props;

        return(
            <TableRow
                key={row[1]}
            >
                {columns.map(column => {
                    const value = row[0][column.id];
                    const text = column.format ? column.format(value) : String(value);

                    return(
                        <TableCell
                            key={column.id}
                            align={column.numeric ? "right" : "left"}
                        >
                            {text}
                        </TableCell>
                    );
                })}
            </TableRow>
        )
    }

    protected getDisplayRows(): [ T, number ][]
    {
        const { order, orderBy, page, rowsPerPage } = this.state;

        const desc = (a, b, orderBy) => {
            if (b[orderBy] < a[orderBy]) {
                return -1;
            }
            if (b[orderBy] > a[orderBy]) {
                return 1;
            }
            return 0;
        };

        const compare = order === "desc" ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
        const rowsWithIndex: any = this.props.rows.map((entry, index) => [entry, index]);

        rowsWithIndex.sort((a, b) => {
            const order = compare(a[0], b[0]);
            return order !== 0 ? order : (a[1] - b[1]);
        });

        const firstRow = page * rowsPerPage;
        return rowsWithIndex.slice(firstRow, firstRow + rowsPerPage);
    }

    protected onClickColumnSort(id: string)
    {
        this.setState((state, props) => ({
            order: id === state.orderBy ? (state.order === "asc" ? "desc" : "asc") : "asc",
            orderBy: id,
        }));
    }

    protected onChangePage(event: unknown, page: number)
    {
        this.setState({
            page
        });
    }

    protected onChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement>)
    {
        this.setState({
            rowsPerPage: Number.parseInt(event.target.value),
            page: 0
        });
    }
}

export default withStyles(DataTable.styles)(DataTable);