'use strict';

import React from 'react';

export default React.createClass({
    render() {
        return (
            <div className="lcb-sidebar">
                {this.props.children}
                <div className="lcb-sidebar-version">
                    <span style={{color: '#72d4ee'}}>materia*</span>
                </div>
            </div>
        )
    }
});
