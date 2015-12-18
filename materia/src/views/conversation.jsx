'use strict';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import IO from 'socket.io-client';

import {
    fetchConversation,
    sendConversationMessage as sendMessage
} from '../actions';

import Loader from '../components/loader';
import Header from '../components/header';
import Messages from '../components/messages';
import Entry from '../components/entry';

const socket = IO();

export default class Conversation extends Component {
    constructor(props) {
        super(props);
        this.sendMessage = this.sendMessage.bind(this);
    };
    componentWillMount() {
        this.props.dispatch(fetchConversation(this.props.params.id));
        socket.on('messages:new', function(message) {
            console.log(message);
        });
    };
    sendMessage(message) {
        this.props.dispatch(sendMessage({
            room: this.props.params.id,
            ...message
        }));
    };
    render() {
        if (true && this.props.isFetching) {
            return (
                <div className="lcb-conversation">
                    <Loader className="lcb-conversation-loader" fadeIn />
                </div>
            );
        }
        return (
            <div className="lcb-conversation">
                <Header
                    title={`#${this.props.slug}`}
                    description={this.props.description} />
                <Messages
                    isFetching={this.props.isFetchingMessages}
                    messages={this.props.messages} />
                <Entry
                    isSendingMessage={this.props.isSendingMessage}
                    sendMessage={this.sendMessage} />
            </div>
        );
    };
};

Conversation.propTypes = {
    isFetching: PropTypes.bool.isRequired,
    isFetchingMessages: PropTypes.bool.isRequired,
    isSendingMessage: PropTypes.bool.isRequired,
    id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    messages: PropTypes.array.isRequired,
    users: PropTypes.array.isRequired,
    files: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
    return state.conversation;
};

export default connect(mapStateToProps)(Conversation);
