'use strict';

import React from 'react';

import { Link } from 'react-router';

export default React.createClass({
    render() {
        return (
            <div className="lcb-tab">
                <Link to={this.props.url}>
                    {this.props.label}
                </Link>
            </div>
        )
    }
});
