'use strict';

import React from 'react';

export default React.createClass({
    render: function() {
        return (
            <div>
                APP
                {this.props.children}
            </div>
        )
    }
});