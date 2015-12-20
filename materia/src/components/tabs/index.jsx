'use strict';

import React from 'react';

import { Link } from 'react-router';

import IconButton from 'material-ui/lib/icon-button';

import HomeIcon from 'react-material-icons/icons/navigation/apps';

export default React.createClass({
    render() {
        return (
            <div className="lcb-tabs">
                <Link to="/materia">
                    <IconButton tooltip="Browse Rooms">
                        <HomeIcon color="#fff" />
                    </IconButton>
                </Link>
                {this.props.children}
            </div>
        )
    }
});
