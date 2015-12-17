'use strict';

import React from 'react';

export default React.createClass({
    render() {
        return (
            <div className="lcb-connection">
                {
                    this.props.isConnecting &&
                    <span>Connecting...</span>
                 }
            </div>
        );
    }
});
