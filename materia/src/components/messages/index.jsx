'use strict';

import React from 'react';

import Message from './message';

export default React.createClass({
    render() {
        return (
            <div className="lcb-messages">
                { this.props.isFetching
                    && <div>Loading...</div>
                    || this.props.messages.map(function(message, i) {
                        return <Message {...message} />;
                    })
                }
            </div>
        )
    }
});
