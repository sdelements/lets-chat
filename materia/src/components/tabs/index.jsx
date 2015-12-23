'use strict';

import React from 'react';

import { Link } from 'react-router';

import IconButton from 'material-ui/lib/icon-button';

import HomeIcon from 'react-material-icons/icons/navigation/apps';

import Tab from './tab';

export default React.createClass({
    render() {
        return (
            <div className="lcb-tabs">
                <Link to="/materia">
                    <IconButton>
                        <HomeIcon color="#fff" />
                    </IconButton>
                </Link>
                {this.props.conversations.map(function(conversation) {
                    return (
                        <Tab
                            key={conversation.id}
                            label={conversation.name}
                            url={`/materia/room/${conversation.id}`} />
                    );
                })}
            </div>
        )
    }
});
