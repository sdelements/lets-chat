'use strict';

import { combineReducers } from 'redux';

import { routeReducer } from 'redux-simple-router';

import {
    REQUEST_CONNECTION,
    RECEIVE_CONNECTION,
    REQUEST_ROOMS,
    RECEIVE_ROOMS,
    REQUEST_CONVERSATION,
    RECEIVE_CONVERSATION,
    REQUEST_CONVERSATION_MESSAGES,
    RECEIVE_CONVERSATION_MESSAGES
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
                isFetching: true
            });
        case RECEIVE_ROOMS:
            return Object.assign({}, state, {
                isFetching: false,
                items: action.rooms
            });
        default:
            return state;
    }
};

function conversation(state = {
    isFetching: true,
    isFetchingMessages: true,
    id: null,
    name: null,
    description: null,
    messages: [],
    users: [],
    files: []
}, action) {
    switch (action.type) {
        case REQUEST_CONVERSATION:
            return Object.assign({}, state, {
                isFetching: true
            });
        case RECEIVE_CONVERSATION:
            return Object.assign({}, state, {
                isFetching: false,
                id: action.id,
                name: action.name,
                slug: action.slug,
                description: action.description,
                users: action.users,
                files: action.files
            });
        case REQUEST_CONVERSATION_MESSAGES:
            return Object.assign({}, state, {
                isFetchingMessages: true
            });
        case RECEIVE_CONVERSATION_MESSAGES:
            console.log(action.messages);
            return Object.assign({}, state, {
                isFetchingMessages: false,
                messages: action.messages
            });
        default:
            return state;
    }
};

export default combineReducers(Object.assign({}, {
    connection,
    rooms,
    conversation
}, {
    routing: routeReducer
}));
