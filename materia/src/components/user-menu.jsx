'use strict';

import React from 'react';

import Avatar from './avatar';

export default React.createClass({
    render() {
        return (
            <div className="lcb-user-menu">
                <Avatar
                    className="lcb-user-menu-avatar"
                    backgroundColor="#72d4ee"
                    size={30}
                    src="https://www.gravatar.com/avatar/{this.props.avatar}?s=30" />
                <div className="lcb-user-menu-meta">
                    <div className="lcb-user-menu-name">
                        {this.props.firstName}
                    </div>
                    <div className="lcb-user-menu-username">
                        @{this.props.username}
                    </div>
                </div>
            </div>
        )
    }
});
