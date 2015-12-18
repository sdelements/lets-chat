'use strict';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import {
    fetchConversation,
    sendConversationMessage as sendMessage
} from '../actions';

import Header from '../components/header';
import Messages from '../components/messages';
import Entry from '../components/entry';

export default class Conversation extends Component {
    constructor(props) {
        super(props);
        this.sendMessage = this.sendMessage.bind(this)
    };
    componentDidMount() {
        this.props.dispatch(fetchConversation(this.props.params.id));
    };
    sendMessage(message) {
        this.props.dispatch(sendMessage({
            room: this.props.params.id,
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
                    sendMessage={this.sendMessage} />
            </div>
        );
    };
};

Conversation.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    messages: PropTypes.array,
    users: PropTypes.array,
    files: PropTypes.array,
    dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
    return state.conversation;
};

export default connect(mapStateToProps)(Conversation);
