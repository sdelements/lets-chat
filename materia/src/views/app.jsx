'use strict';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import { socket } from '../services/io'

import LockIcon from 'react-material-icons/icons/action/lock-outline';

import Sidebar from '../components/sidebar';
import UserMenu from '../components/user-menu';
import Tabs from '../components/tabs';
import Connection from '../components/connection';
import Main from '../components/main';

import {
    fetchWhoAmI,
    clientConnected,
    clientDisconnected,
    clientError
} from '../actions';

class App extends Component {
    constructor(props) {
        super(props);
    };
    componentWillMount() {

        const { dispatch } = this.props;

        socket.on('connect', function() {
            dispatch(clientConnected());
        });

        socket.on('disconnect', function() {
            dispatch(clientDisconnected());
        });

        socket.on('error', function(err) {
            dispatch(clientError(err));
        });

        dispatch(fetchWhoAmI());

    };
    render() {
        if (!this.props.connection.isAuthenticated) {
            return (
                <div className="lcb-app">
                    <div className="lcb-app-message">
                        <LockIcon
                            className="lcb-app-message-icon"
                            color="inherit"
                            style={{
                                width: '70px',
                                height: '70px'
                            }} />
                        <div className="lcb-app-message-text">
                            Your session has expired.
                        </div>
                        <div className="lcb-app-message-actions">
                            <a className="lcb-fancy-link"
                                href="/login">Sign in</a>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="lcb-app">
                <Sidebar>
                    <UserMenu isFetching={this.props.user.isFetching} {...this.props.user.profile} />
                    <Tabs
                        selected={this.props.params.id}
                        conversations={this.props.conversations.items} />
                    <Connection isConnected={this.props.connection.isConnected} />
                </Sidebar>
                <Main>
                    {this.props.children}
                </Main>
            </div>
        );
    };
};

App.propTypes = {
    connection: React.PropTypes.shape({
        isConnected: PropTypes.bool.isRequired
    }),
    dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
    return state;
};

export default connect(mapStateToProps)(App);
