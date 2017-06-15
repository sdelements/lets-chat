'use strict';

import React, { PropTypes } from 'react';

import SyncIcon from 'react-material-icons/icons/notification/sync';
import SyncProblemIcon from 'react-material-icons/icons/notification/sync-problem';

const styles = {
    icon: {
        width: '18px',
        height: '18px',
        verticalAlign: 'bottom',
        marginBottom: '-4px',
        marginRight: '3px'
    },
    disconnected: {
        color: '#ff7878'
    }
};

const Connection = React.createClass({
    propTypes: {
        isConnected: PropTypes.bool.isRequired
    },
    render() {
        return (
            <div className="lcb-sidebar-connection">
                {
                    this.props.isConnected &&
                    <span>
                        <SyncIcon color="#fff" style={styles.icon} />
                        Connected
                    </span>
                }
                {
                    !this.props.isConnected &&
                    <span style={styles.disconnected}>
                        <SyncProblemIcon
                            color={styles.disconnected.color}
                            style={styles.icon} />
                        Disconnected
                    </span>
                }
            </div>
        );
    }
});

export default Connection;
