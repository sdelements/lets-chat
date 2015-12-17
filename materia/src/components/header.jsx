'use strict';

import React from 'react';

export default React.createClass({
    render() {
        return (
            <header className="lcb-header">
                <div className="lcb-header-meta">
                    <h1 className="lcb-header-title">{this.props.title}</h1>
                    <p className="lcb-header-description">{this.props.description}</p>
                </div>
            </header>
        )
    }
});
