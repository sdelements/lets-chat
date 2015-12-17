'use strict';

import React from 'react';

import Message from './message';

export default React.createClass({
    render() {
        return (
            <div className="lcb-messages">
                {this.props.messages.map(function(message, i) {
                    return <Message {...message} />;
                })}
            </div>
        )
    }
});
