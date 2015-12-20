'use strict';

import React from 'react';

import Loader from '../loader';
import Message from './message';

export default React.createClass({
    getInitialState() {
        return {
            scrollLocked: true
        }
    },
    componentDidUpdate() {
        this.scroll();
    },
    onScroll() {
        const $list = this.refs.list;
        const locked =
            ($list.scrollHeight - $list.scrollTop) - 5
            <= $list.offsetHeight;
        this.setState({
            scrollLocked: locked
        });
    },
    scroll() {
        const $list = this.refs.list;
        $list.scrollTop = $list.scrollHeight;
    },
    render() {
        return (
            <div
                className="lcb-messages"
                ref="list"
                onScroll={this.onScroll}>
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
