'use strict';

import React, { Component } from 'react';

import ReactLinkedStateMixin from 'react-addons-linked-state-mixin';

export default React.createClass({
    mixins: [ReactLinkedStateMixin],
    getInitialState: function() {
        return {
            text: ''
        }
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
                    placeholder="Got something to say?"
                    valueLink={this.linkState('text')}
                    onKeyDown={this.sendMessage}
                ></textarea>
                <button
                    className="lcb-entry-button"
                    aria-label="Send">
                    Send
                </button>
            </div>
        )
    }
});
