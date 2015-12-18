'use strict';

import React from 'react';

import Loader from '../loader';
import Message from './message';

export default React.createClass({
    render() {
        return (
            <div className="lcb-messages">
                { this.props.isFetching
                    && <Loader className="lcb-messages-loader" />
                    || this.props.messages.map(function(message, i) {
                        return <Message key={message.id} {...message} />;
                    })
                }
            </div>
        )
    }
});
