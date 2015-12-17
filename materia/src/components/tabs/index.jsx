'use strict';

import React from 'react';

export default React.createClass({
    render() {
        return (
            <div className="lcb-tabs">
                {this.props.children}
            </div>
        )
    }
});
