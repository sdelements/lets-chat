'use strict';

import { combineReducers } from 'redux';

import update from 'react-addons-update';

import { routeReducer } from 'redux-simple-router';

import {
    CLIENT_CONNECTED,
    CLIENT_DISCONNECTED,
    REQUEST_WHO_AM_I,
    RECEIVE_WHO_AM_I,
    REQUEST_ROOMS,
    RECEIVE_ROOMS,
    REQUEST_CONVERSATION,
    RECEIVE_CONVERSATION,
    REQUEST_CONVERSATION_MESSAGES,
    RECEIVE_CONVERSATION_MESSAGES,
    ATTEMPT_CONVERSATION_MESSAGE,
    CONFIRM_CONVERSATION_MESSAGE,
    RECEIVE_CONVERSATION_MESSAGE
} from '../actions';

function connection(state = {
    isConnected: false
}, action) {
    switch (action.type) {
        case CLIENT_CONNECTED:
            return Object.assign({}, state, {
                isConnected: true
            });
        case CLIENT_DISCONNECTED:
            return Object.assign({}, state, {
                isConnected: false
            });
        default:
            return state;
    };
};

function user(state = {
    isFetching: true,
    profile: {}
}, action) {
    switch (action.type) {
        case REQUEST_WHO_AM_I:
            return Object.assign({}, state, {
                isFetching: true
            });
        case RECEIVE_WHO_AM_I:
            return Object.assign({}, state, {
                isFetching: false,
                profile: Object.assign({}, action.user)
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
    isSendingMessage: false,
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
                description: action.description
            });
        case REQUEST_CONVERSATION_MESSAGES:
            return Object.assign({}, state, {
                isFetchingMessages: true
            });
        case RECEIVE_CONVERSATION_MESSAGES:
            return Object.assign({}, state, {
                isFetchingMessages: false,
                messages: action.messages.reverse()
            });
        case ATTEMPT_CONVERSATION_MESSAGE:
            return Object.assign({}, state, {
                isSendingMessage: true
            });
        case CONFIRM_CONVERSATION_MESSAGE:
            return Object.assign({}, state, {
                isSendingMessage: false
            });
        case RECEIVE_CONVERSATION_MESSAGE:
            return Object.assign({}, state, {
                messages: update(state.messages, {
                    $push: [action.message]
                })
            });
        default:
            return state;
    }
};

export default combineReducers(Object.assign({}, {
    connection,
    user,
    rooms,
    conversation
}, {
    routing: routeReducer
}));
