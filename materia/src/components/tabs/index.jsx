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
                    <IconButton>
                        <HomeIcon color="#fff" />
                    </IconButton>
                </Link>
                { this.props.conversations.map(function(conversation) {
                    return (
                        <div key={conversation.id}>
                            <Link to={`/materia/room/${conversation.id}`}>
                                {conversation.name}
                            </Link>
                        </div>
                    );
                })}
            </div>
        )
    }
});
