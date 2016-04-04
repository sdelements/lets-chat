'use strict';

import './sass/style.sass';

import React from 'react';
import ReactDOM from 'react-dom';

import { combineReducers, applyMiddleware } from 'redux'

import { Provider } from 'react-redux';

import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';

import createStore from './store';

import App from './views/app';
import Browser from './views/browser';
import Conversation from './views/conversation';

const store = createStore();

const history = syncHistoryWithStore(browserHistory, store)

ReactDOM.render(
    <Provider store={store}>
        <Router history={history}>
            <Route path="/m" component={App}>
                <IndexRoute component={Browser}/>
                <Route path="room/:id" component={Conversation} />
            </Route>
        </Router>
    </Provider>,
    document.getElementById('lcb-app-mount')
);
