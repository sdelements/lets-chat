'use strict';

import React from 'react';

import moment from 'moment';

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
                    && <Loader className="lcb-messages-loader" fadeIn />
                    || this.props.messages.map((message, i, messages) => {
                        let posted = moment(message.posted);
                        let lastMessage = messages[--i];
                        let isFragment = false;
                        if (lastMessage && lastMessage.owner) {
                            isFragment = lastMessage.owner.id
                                === message.owner.id &&
                                posted.diff(lastMessage.posted, 'minutes') < 2;
                        }
                        return <Message key={message.id} {...message} fragment={isFragment} />;
                    })
                }
            </div>
        )
    }
});
