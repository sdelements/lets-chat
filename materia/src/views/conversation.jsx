'use strict';

import _ from 'lodash';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import { socket } from '../services/io';

import {
    joinConversation,
    receiveConversationMessage,
    sendConversationMessage
} from '../actions';

import Loader from '../components/loader';
import Header from '../components/header';
import Messages from '../components/messages';
import Entry from '../components/entry';

export default class Conversation extends Component {
    constructor(props) {
        super(props);
        this.sendMessage = this.sendMessage.bind(this);
    };
    componentWillMount() {

        const { dispatch } = this.props;

        socket.on('messages:new', function(message) {
            dispatch(receiveConversationMessage(message.room.id, message));
        });

        dispatch(joinConversation(this.props.params.id));

    };
    componentWillReceiveProps(nextProps) {
        if (this.props.params.id === nextProps.params.id) {
            return;
        }
        this.props.dispatch(joinConversation(nextProps.params.id));
    };
    sendMessage(message) {
        this.props.dispatch(sendConversationMessage(this.props.params.id, {
            ...message
        }));
    };
    render() {
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
    isFetching: PropTypes.bool,
    isFetchingMessages: PropTypes.bool,
    isSendingMessage: PropTypes.bool,
    id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    messages: PropTypes.array,
    users: PropTypes.array,
    files: PropTypes.array,
    dispatch: PropTypes.func
};

function mapStateToProps(state, props) {
    return _.find(state.conversations.items, {
        id: props.params.id
    }) || {
        isFetching: false,
        messages: []
    }
};

export default connect(mapStateToProps)(Conversation);
