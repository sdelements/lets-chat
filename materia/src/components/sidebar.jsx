'use strict';

import React from 'react';

export default React.createClass({
    render() {
        return (
            <div className="lcb-sidebar">
                {this.props.children}
            </div>
        )
    }
});
