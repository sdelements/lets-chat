'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { Router, Route } from 'react-router';
import { createHistory } from 'history';
import { syncReduxAndRouter, routeReducer } from 'redux-simple-router';

import App from './components/app';
import Conversation from './components/conversation';

const reducer = combineReducers(Object.assign({}, {}, {
  routing: routeReducer
}));
const store = createStore(reducer);
const history = createHistory();

syncReduxAndRouter(history, store);

ReactDOM.render(
    <Provider store={store}>
        <Router history={history}>
            <Route path="/materia" component={App}>
                <Route path="conversation" component={Conversation} />
            </Route>
        </Router>
    </Provider>,
    document.getElementById('app-mount')
);