'use strict';

import './sass/style.sass';

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import { Router, Route, IndexRoute } from 'react-router';
import { syncReduxAndRouter } from 'redux-simple-router';
import { createHistory } from 'history';

import createStore from './store';

import App from './components/app';
import Browser from './components/browser';
import Conversation from './components/conversation';

const store = createStore();

const history = createHistory();

syncReduxAndRouter(history, store);

ReactDOM.render(
    <Provider store={store}>
        <Router history={history}>
            <Route path="/materia" component={App}>
                <IndexRoute component={Browser}/>
                <Route path="room/:id" component={Conversation} />
            </Route>
        </Router>
    </Provider>,
    document.getElementById('lcb-app-mount')
);
