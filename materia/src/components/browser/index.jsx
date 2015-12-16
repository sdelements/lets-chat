'use strict';

import React, { Component } from 'react';

export default class Browser extends Component {
    constructor(props) {
        super(props);
    };
    render() {
        return (
            <div className="lcb-browser">
                Browser
                {this.props.children}
            </div>
        );
    };
};
