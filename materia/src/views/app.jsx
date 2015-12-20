'use strict';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import { socket } from '../services/io'

import Sidebar from '../components/sidebar';
import Connection from '../components/connection';
import Main from '../components/main';
import Tabs from '../components/tabs';

import {
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

    };
    render() {
        return (
            <div className="lcb-app">
                <Sidebar>
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
