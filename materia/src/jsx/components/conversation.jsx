'use strict';

import React from 'react';

export default React.createClass({
    render: function() {
        return (
            <div>
                Some Conversation
                {this.props.children}
            </div>
        )
    }
});