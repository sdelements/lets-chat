'use strict';

import React from 'react';

import Sidebar from './sidebar';
import Main from './main';
import Tabs from './tabs';

export default React.createClass({
    render() {
        return (
            <div className="lcb-app">
                <Sidebar>
                    <Tabs />
                </Sidebar>
                <Main>
                    {this.props.children}
                </Main>
            </div>
        )
    }
});
