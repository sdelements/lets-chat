'use strict';

import React from 'react';

import List from 'react-variable-height-infinite-scroller';

import Message from './message';

export default React.createClass({
    renderRow(index) {
        const message = this.props.messages[index];
        return <Message {...message} />;
    },
    render() {
        return (
            /**=
            <List
                containerHeight={500}
                className="lcb-messages"
                renderRow={this.renderRow} // function to render a row
                totalNumberOfRows={this.props.messages.length} />
             **/
            <div className="lcb-messages">
                {this.props.messages.map(function(message, i) {
                    return <Message {...message} />;
                })}
            </div>
        )
    }
});
