'use strict';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import {
    fetchConversation
} from '../actions';

import Header from '../components/header';
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
                <Header
                    title={`#${this.props.slug}`}
                    description={this.props.description} />
                <Messages />
            </div>
        );
    };
};

Conversation.propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    description: PropTypes.string,
    users: PropTypes.array,
    files: PropTypes.array,
    dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
    return state.conversation;
};

export default connect(mapStateToProps)(Conversation);
