'use strict';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import { socket } from '../services/io'

import Sidebar from '../components/sidebar';
import UserMenu from '../components/user-menu';
import Tabs from '../components/tabs';
import Connection from '../components/connection';
import Main from '../components/main';

import {
    fetchWhoAmI,
    clientConnected
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

        dispatch(fetchWhoAmI());

    };
    render() {
        return (
            <div className="lcb-app">
                <Sidebar>
                    <UserMenu {...this.props.user.profile} />
                    <Tabs />
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
