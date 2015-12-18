'use strict';

import React from 'react';

import Radium, { Style } from 'radium';

import Spinner from 'react-spinkit';

@Radium
export default class Button extends React.Component {
    render() {
        return (
            <span
                {...this.props}
                className={`lcb-loader ${this.props.className}`}>
                <Spinner noFadeIn spinnerName="cube-grid" />
                <Style
                    scopeSelector=".lcb-loader"
                    rules={{
                        '.spinner': {
                            transform: 'rotate(45deg)'
                        },
                        '.cube': {
                            background: this.props.color || '#72d4ee'
                        }
                    }} />
            </span>
        );
    };
};
