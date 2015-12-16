'use strict';

import React, { PropTypes, Component } from 'react';

import { connect } from 'react-redux';

import {
    fetchConnection
} from '../../actions';

import Sidebar from './sidebar';
import Connection from './connection';
import Main from './main';
import Tabs from './tabs';

class App extends Component {
    constructor(props) {
        super(props);
    };
    componentDidMount() {
        const { dispatch } = this.props;
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
                    {React.cloneElement(this.props.children, this.state)}
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
