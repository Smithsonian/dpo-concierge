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
import { History } from "react-router-dom";

import moment from "moment";

import { withStyles, StyleRules } from "@material-ui/core/styles";

import Tooltip from "@material-ui/core/Tooltip";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import TablePagination from "@material-ui/core/TablePagination";

import { getStorageObject, setStorageObject } from "../utils/LocalStorage";

////////////////////////////////////////////////////////////////////////////////

export type TableCellFormatter<T extends {} = {}> = (value: any, row: T, column: ITableColumn<T>) => any;

export const formatText: TableCellFormatter = value => value === undefined || value === null ? "" : String(value);
export const formatDateTime: TableCellFormatter = value => moment(value).format("YYYY-MM-DD HH:mm:ss");
export const  formatDate: TableCellFormatter = value => moment(value).format("YYYY-MM-DD");
export const formatTime: TableCellFormatter = value => moment(value).format("HH:mm:ss");


export interface ITableColumn<T extends {} = {}>
{
    id: string;
    label?: string;
    numeric?: boolean;
    format?: TableCellFormatter;
    width?: string | number;
    data?: any;
}

export interface IDataTableProps<T extends {} = {}>
{
    rows: T[];
    columns: ITableColumn<T>[];
    storageKey?: string;
    history?: History;

    classes: {
        root: string;
        wrapper: string;
        table: string;
        cell: string;
    }
}

export interface IDataTableState
{
    order: "asc" | "desc";
    orderBy: string;
    page: number;
    rowsPerPage: number;
}

class DataTable<T extends {} = {}> extends React.Component<IDataTableProps<T>, IDataTableState>
{
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
        const { rows, classes, storageKey } = this.props;

        const params: any = queryString.parse(location.search);

        const state = storageKey ? getStorageObject(storageKey, this.state) : this.state;

        let page = params.page !== undefined ? parseInt(params.page) || 0 : state.page;
        const rowsPerPage = params.rowsPerPage !== undefined ? parseInt(params.rowsPerPage) || 10 : state.rowsPerPage;
        const order = params.order !== undefined ? params.order : state.order;
        const orderBy = params.orderBy !== undefined ? params.orderBy : state.orderBy;

        if (page * rowsPerPage >= rows.length) {
            page = 0;
        }

        if (storageKey) {
            setStorageObject(storageKey, { page, rowsPerPage, order, orderBy });
        }

        return (
            <div className={classes.root}>
                <div className={classes.wrapper}>
                    <Table className={classes.table}>
                        <TableHead>
                            {this.renderHeadRow(order, orderBy)}
                        </TableHead>
                        <TableBody>
                            {this.getDisplayRows(state).map((row, index) => this.renderRow(row))}
                        </TableBody>
                    </Table>
                </div>
                <TablePagination
                    component="div"
                    rowsPerPageOptions={[ 5, 10, 20, 50, 100 ]}
                    count={rows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={this.onChangePage}
                    onChangeRowsPerPage={this.onChangeRowsPerPage}
                />
            </div>
        );
    }

    protected renderHeadRow(order, orderBy)
    {
        const { columns, classes } = this.props;

        return(
            <TableRow>
                {columns.map(column => (
                    <TableCell
                        style={{ width: column.width }}
                        key={column.id}
                        align={column.numeric ? "right" : "left"}
                        sortDirection={orderBy === column.id ? order : false}
                    >
                        <TableSortLabel
                            className={classes.cell}
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
        const { columns, classes } = this.props;

        return(
            <TableRow
                key={row[1]}
            >
                {columns.map(column => {
                    const values = row[0];
                    const value = values[column.id];
                    const content = column.format ? column.format(value, values, column) : String(value);
                    const isText = typeof content === "string";

                    return(
                        <TableCell
                            key={column.id}
                            align={column.numeric ? "right" : "left"}
                        >
                            {isText ? (
                                <Tooltip title={content} enterDelay={500} placement="bottom-start">
                                    <div
                                        className={classes.cell}
                                        style={column.width ? { width: column.width } : null}
                                    >
                                        {content}
                                    </div>
                                </Tooltip>
                            ) : content}

                        </TableCell>
                    );
                })}
            </TableRow>
        )
    }

    protected getDisplayRows(state: IDataTableState): [ T, number ][]
    {
        const { page, rowsPerPage, order, orderBy } = state;

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
        const state = this.state;

        this.updateState({
            order: id === state.orderBy ? (state.order === "asc" ? "desc" : "asc") : "asc",
            orderBy: id,
        });
    }

    protected onChangePage(event: unknown, page: number)
    {
        this.updateState({ page });
    }

    protected onChangeRowsPerPage(event: React.ChangeEvent<HTMLInputElement>)
    {
        this.updateState({ page: 0, rowsPerPage: Number.parseInt(event.target.value) });
    }

    protected updateState(state: Partial<IDataTableState>)
    {
        const { history, storageKey } = this.props;

        this.setState(prevState => {
            const nextState = Object.assign({}, prevState, state);
            if (storageKey) {
                setStorageObject(storageKey, nextState);
            }
            if (history) {
                const vars = Object.keys(nextState).map(key => `${key}=${encodeURIComponent(nextState[key])}`).join("&");
                history.push(`${location.pathname}?${vars}`);
            }
            return nextState;
        });
    }
}

const styles = theme => ({
    root: {
    },
    wrapper: {
        overflow: "auto",
    },
    table: {
    },
    cell: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
} as StyleRules);

export default withStyles(styles)(DataTable);