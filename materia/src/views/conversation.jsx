'use strict';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import {
    fetchConversation
} from '../actions';

import Messages from '../components/messages';

export default class Conversation extends Component {
    constructor(props) {
        super(props);
    };
    componentDidMount() {

        const { dispatch } = this.props;

        dispatch(fetchConversation(this.props.params.id));

    };
    render() {
        return (
            <div className="lcb-conversation">
                <h1 style={{ color: '#fff' }}>{this.props.name}</h1>
                <Messages />
            </div>
        );
    };
};

Conversation.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    users: PropTypes.array,
    files: PropTypes.array,
    dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
    console.log(state.conversation)
    return state.conversation;
};

export default connect(mapStateToProps)(Conversation);
