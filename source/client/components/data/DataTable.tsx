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

import moment from "moment";

import { withStyles, StyleRules } from "@material-ui/core/styles";

import Tooltip from "@material-ui/core/Tooltip";
import CircularProgress from "@material-ui/core/CircularProgress";

import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import TablePagination from "@material-ui/core/TablePagination";

////////////////////////////////////////////////////////////////////////////////

const styles = theme => ({
    root: {
    },
    wrapper: {
        overflow: "auto",
    },
    table: {
        overflow: "auto",
    },
    tableCell: {
        padding: theme.spacing(1.5),
    },
    innerCell: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    footer: {
        display: "flex",
        alignItems: "center",
    },
    progress: {
        margin: "0 16px",
    },
    pagination: {
        flex: 1,
    },
} as StyleRules);

export interface IDataTableView
{
    order: "asc" | "desc";
    orderBy: string;
    page: number;
    rowsPerPage: number;
    search?: string;
}

export const defaultView: IDataTableView = {
    order: "asc",
    orderBy: "",
    rowsPerPage: 10,
    page: 0,
    search: "",
};

export interface ITableColumn<T extends {} = {}>
{
    id: string;
    label?: string;
    numeric?: boolean;
    format?: TableCellFormatter;
    width?: string | number;
    data?: any;
}

export type TableCellFormatter<T extends {} = {}> = (value: any, row: T, column: ITableColumn<T>) => any;

export const formatText: TableCellFormatter = value => value === undefined || value === null ? "" : String(value);
export const formatDateTime: TableCellFormatter = value => moment(value).format("YYYY-MM-DD HH:mm:ss");
export const formatDate: TableCellFormatter = value => moment(value).format("YYYY-MM-DD");
export const formatTime: TableCellFormatter = value => moment(value).format("HH:mm:ss");

export interface IDataTableProps<T extends {} = {}>
{
    rows: T[];
    columns: ITableColumn<T>[];
    count: number;
    idKey?: string;
    view?: IDataTableView;
    onViewChange?: (view: IDataTableView) => void;
    loading?: boolean;

    classes: {
        root: string;
        wrapper: string;
        table: string;
        tableCell: string;
        innerCell: string;
        footer: string;
        progress: string;
        pagination: string;
    }
}

function DataTable(props: React.PropsWithChildren<IDataTableProps>)
{
    let { loading, rows, columns, count, idKey, view, onViewChange, classes } = props;

    if (!rows) {
        throw new Error("DataTable.props.rows not defined");
    }
    if (!columns) {
        throw new Error("DataTable.props.columns not defined");
    }

    idKey = idKey || "id";

    view = view || defaultView;

    if (count < view.page * view.rowsPerPage) {
        view.page = 0;
        onViewChange && onViewChange({ ...view, page: 0 });
    }

    return (
        <div className={classes.root}>
            <div className={classes.wrapper}>
                <Table className={classes.table} stickyHeader={true}>
                    <TableHead>
                        <TableRow>
                            {columns.map(column => (
                                <TableCell
                                    className={classes.tableCell}
                                    style={{ width: column.width }}
                                    key={column.id}
                                    align={column.numeric ? "right" : "left"}
                                    sortDirection={view.orderBy === column.id ? view.order : false}
                                >
                                    {column.id.startsWith("_") ? column.label : <TableSortLabel
                                        className={classes.innerCell}
                                        active={view.orderBy === column.id}
                                        direction={view.order}
                                        onClick={() => {
                                            const order = view.orderBy === column.id ?
                                                (view.order === "asc" ? "desc" : "asc") : "asc";
                                            onViewChange && onViewChange({ ...view, order, orderBy: column.id });
                                        }}
                                    >
                                        {column.label}
                                    </TableSortLabel>}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.map(row => (
                            <TableRow
                                key={row[idKey]}
                            >
                                {columns.map(column => {
                                    const value = row[column.id];
                                    const content = column.format ? column.format(value, row, column) : String(value);
                                    const isText = typeof content === "string";

                                    return(
                                        <TableCell
                                            className={classes.tableCell}
                                            key={column.id}
                                            align={column.numeric ? "right" : "left"}
                                        >
                                            {isText ? (
                                                <Tooltip title={content} enterDelay={500} placement="bottom-start">
                                                    <div
                                                        className={classes.innerCell}
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
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className={classes.footer}>
                {loading ? <CircularProgress
                    className={classes.progress}
                    disableShrink
                    size={30}
                /> : null}
                <TablePagination
                    className={classes.pagination}
                    component="div"
                    rowsPerPageOptions={[ 10, 15, 20, 50, 100 ]}
                    count={count || rows.length}
                    rowsPerPage={view.rowsPerPage}
                    page={view.page}
                    onChangePage={(event, page: number) =>
                        onViewChange && onViewChange({ ...view, page })
                    }
                    onChangeRowsPerPage={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const rowsPerPage = Number.parseInt(event.target.value);
                        onViewChange && onViewChange({ ...view, rowsPerPage })
                    }}
                />
            </div>
        </div>
    );
}

export default withStyles(styles)(DataTable);