'use strict';

import { combineReducers } from 'redux';

import { routeReducer } from 'redux-simple-router';

import {
    REQUEST_CONNECTION,
    RECEIVE_CONNECTION,
    REQUEST_ROOMS,
    RECEIVE_ROOMS
} from '../actions';

function connection(state = {
    isConnecting: false
}, action) {
    switch (action.type) {
        case REQUEST_CONNECTION:
            return Object.assign({}, state, {
                isConnecting: true
            });
        case RECEIVE_CONNECTION:
            return Object.assign({}, state, {
                isConnecting: false
            });
        default:
            return state;
    };
};


function rooms(state = {
    isFetching: true,
    items: []
}, action) {
    switch (action.type) {
        case REQUEST_ROOMS:
            return Object.assign({}, state, {
                isFetching: true,
                items: state.items
            });
        case RECEIVE_ROOMS:
            return Object.assign({}, state, {
                isFetching: false,
                items: action.rooms || []
            });
        default:
            return state;
    }
};

export default combineReducers(Object.assign({}, {
    connection,
    rooms
}, {
    routing: routeReducer
}));
