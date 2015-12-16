'use strict';

import React, { PropTypes, Component } from 'react';

import IO from 'socket.io-client';

import { connect } from 'react-redux';

import {
    fetchConnection,
    fetchRooms
} from '../../actions';

import Sidebar from './sidebar';
import Connection from './connection';
import Main from './main';
import Tabs from './tabs';

const socket = IO();

class App extends Component {
    constructor(props) {
        super(props);
    };
    componentDidMount() {

        const { dispatch } = this.props;

        socket.on('users:join', function() {
            dispatch(fetchRooms());
        });

        socket.on('users:leave', function() {
            dispatch(fetchRooms());
        });

        dispatch(fetchConnection());

    };
    render() {
        return (
            <div className="lcb-app">
                <Sidebar>
                    <Tabs />
                    <Connection isConnecting={this.props.connection.isConnecting} />
                </Sidebar>
                <Main>
                    {React.cloneElement(this.props.children, {
                        rooms: this.props.rooms
                    })}
                </Main>
            </div>
        );
    };
};

App.propTypes = {
    connection: React.PropTypes.shape({
        isConnecting: PropTypes.bool.isRequired
    }),
    dispatch: PropTypes.func.isRequired
};

function mapStateToProps(state, props) {
    return state;
};

export default connect(mapStateToProps)(App);
