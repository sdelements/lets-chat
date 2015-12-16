'use strict';

import React from 'react';

export default React.createClass({
    render: function() {
        return (
            <div className="lcb-browser">
                Browser
                {this.props.children}
            </div>
        )
    }
});
