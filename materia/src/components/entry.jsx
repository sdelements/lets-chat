'use strict';

import React from 'react';

export default React.createClass({
    render() {
        return (
            <div className="lcb-entry">
                <textarea
                    className="lcb-entry-input"
                    placeholder="Got something to say?"
                    autofocus></textarea>
                <button
                    className="lcb-entry-button"
                    aria-label="Send">
                    Send
                </button>
            </div>
        )
    }
});
