'use strict';

import React, { PropTypes } from 'react';

import Avatar from 'material-ui/lib/avatar';

export default React.createClass({
    propTypes: {
        src: React.PropTypes.string,
        backgroundColor: React.PropTypes.string,
        size: React.PropTypes.number
    },
    getDefaultProps() {
        return {
            backgroundColor: '#72d4ee',
            size: 40
        };
    },
    render() {
        return (
            <span
                className={`lcb-avatar ${this.props.className}`}
                style={{
                    width: this.props.size,
                    height: this.props.size,
                    display: 'inline-block'
                }}
            >
                <Avatar
                    backgroundColor={this.props.backgroundColor}
                    size={this.props.size}
                    src={this.props.src}
                    style={{
                        width: 'inherit',
                        height: 'inherit',
                        border: 'none',
                        borderRadius: 'inherit'
                    }}>
                        {this.props.children}
                </Avatar>
            </span>
        )
    }
});
