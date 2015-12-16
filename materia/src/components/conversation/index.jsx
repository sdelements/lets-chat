'use strict';

import React from 'react';

export default React.createClass({
    render: function() {
        return (
            <div className="lcb-conversation">
                Some Conversation
                {this.props.children}
            </div>
        )
    }
});
