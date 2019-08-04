import * as React from "react";
import { CSSProperties } from "react";

import Button from "@material-ui/core/Button";

////////////////////////////////////////////////////////////////////////////////

/** Properties for [[Application]] component. */
export interface IApplicationProps
{
    className?: string;
    style?: CSSProperties;
}

interface IApplicationState
{
}

export default class Application extends React.Component<IApplicationProps, IApplicationState>
{
    static readonly defaultProps: IApplicationProps = {
        className: "Application"
    };

    protected static readonly style: CSSProperties = {
    };

    constructor(props: IApplicationProps)
    {
        super(props);

        this.state = {
        };
    }

    render()
    {
        const {
            className,
            style,
        } = this.props;

        const styles = Object.assign({}, Application.style, style);

        return (
            <Button variant="contained" color="primary">
                Hello World
            </Button>
        );
    }
}