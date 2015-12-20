'use strict';

import React, { PropTypes } from 'react';

import Radium, { Style } from 'radium';

import Spinner from 'react-spinkit';

const Loader = React.createClass({
    propTypes: {
        color: React.PropTypes.string,
        size: React.PropTypes.number
    },
    getDefaultProps() {
        return {
            fadeIn: false,
            color: '#72d4ee',
            size: 40
        };
    },
    render() {
        return (
            <span
                {...this.props}
                className={`lcb-loader ${this.props.className}`}
                >
                <Spinner noFadeIn={!this.props.fadeIn} spinnerName="cube-grid" />
                <Style
                    scopeSelector=".lcb-loader"
                    rules={{
                        '.spinner': {
                            transform: 'rotate(45deg)'
                        },
                        '.cube': {
                            background: this.props.color
                        },
                        '.cube-grid': {
                            width: this.props.size + 'px',
                            height: this.props.size + 'px'
                        }
                    }} />
            </span>
        )
    }
});

export default Radium(Loader);
