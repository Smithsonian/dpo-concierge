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

import { withStyles } from "@material-ui/core/styles";

import Input from "@material-ui/core/Input";
import SearchIcon from "@material-ui/icons/Search";

////////////////////////////////////////////////////////////////////////////////

export interface ISearchInputProps
{
    search: string;
    onSearchChange: (search: string) => void;

    classes: {
        root: string;
    }
}

const styles = theme => ({
    root: {
        display: "flex",
        alignItems: "center",
    },
});

function SearchInput(props: ISearchInputProps)
{
    const { search, onSearchChange, classes } = props;

    return (
        <div className={classes.root}>
            <SearchIcon />
            <Input
                type="search"
                defaultValue={search}
                onBlur={(e: any) => onSearchChange(e.target.value)}
                onChange={(e: any) => !e.target.value && onSearchChange("")}
                onKeyDown={(e: any) => e.key === "Enter" && onSearchChange(e.target.value)}
            />
        </div>
    );
}

export default withStyles(styles)(SearchInput);