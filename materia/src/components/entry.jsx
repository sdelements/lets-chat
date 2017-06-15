'use strict';

import React, { Component } from 'react';

import ReactDOM from 'react-dom';

import ReactLinkedStateMixin from 'react-addons-linked-state-mixin';

import IconButton from 'material-ui/lib/icon-button';
import SendIcon from 'react-material-icons/icons/content/send';

import Loader from './loader';

export default React.createClass({
    mixins: [ReactLinkedStateMixin],
    getInitialState: function() {
        return {
            text: ''
        }
    },
    componentDidMount(){
        ReactDOM.findDOMNode(this.refs.text).focus();
    },
    sendMessage(e) {
        if (e.which !== 13) {
            return;
        }
        e.preventDefault();
        if (this.state.text.length === 0) {
            return;
        }
        this.props.sendMessage({
            text: this.state.text
        });
        this.setState({
            text: ''
        });
    },
    render() {
        return (
            <div className="lcb-entry">
                <textarea
                    className="lcb-entry-input"
                    ref="text"
                    placeholder="Got something to say?"
                    valueLink={this.linkState('text')}
                    onKeyDown={this.sendMessage}
                ></textarea>
                <Loader
                    className="lcb-entry-loader"
                    fadeIn
                    style={{
                        visibility:
                            this.props.isSendingMessage
                            && 'visible' || 'hidden'
                    }}
                    size={18} />
                <IconButton
                    className="lcb-entry-button"
                    aria-label="Send">
                    <SendIcon color="#bbb" />
                </IconButton>
            </div>
        )
    }
});
