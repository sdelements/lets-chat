'use strict';

import React from 'react';

export default React.createClass({
    render() {
        return (
            <div className="lcb-message">
                <img
                    className="lcb-message-avatar lcb-avatar"
                    src="https://www.gravatar.com/avatar/{{owner.avatar}}?s=30" />
                <div class="lcb-message-meta">
                        <span class="lcb-message-name">
                            <span class="lcb-room-poke">
                                <span class="lcb-message-displayname">
                                    {{owner.displayName}}
                                </span>
                                <span class="lcb-message-username">
                                    @{{owner.username}}
                                </span>
                            </span>
                        </span>
                        <time class="lcb-message-time" title="{{posted}}"></time>
                </div>
            </div>
        )
    }
});
