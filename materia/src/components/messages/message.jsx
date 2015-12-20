'use strict';

import React from 'react';

export default React.createClass({
    render() {
        return (
            <div className="lcb-message">
                <img
                    className="lcb-message-avatar lcb-avatar"
                    src="https://www.gravatar.com/avatar/?s=30" />
                <div className="lcb-message-meta">
                    <span className="lcb-message-name">
                        <span className="lcb-message-displayname">
                            {this.props.owner.displayName}
                        </span>
                        <span className="lcb-message-username">
                            @{this.props.owner.username}
                        </span>
                    </span>
                    <time className="lcb-message-time">
                        {this.props.posted}
                    </time>
                    <div className="lcb-message-text">
                        {this.props.text}
                    </div>
                </div>
            </div>
        )
    }
});
