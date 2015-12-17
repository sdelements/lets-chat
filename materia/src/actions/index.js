'use strict';

import IO from 'socket.io-client';

export const REQUEST_CONNECTION = 'REQUEST_CONNECTION';
export const RECEIVE_CONNECTION = 'RECEIVE_CONNECTION';

export const REQUEST_ROOMS = 'REQUEST_ROOMS';
export const RECEIVE_ROOMS = 'RECEIVE_ROOMS';

export const REQUEST_CONVERSATION = 'REQUEST_CONVERSATION';
export const RECEIVE_CONVERSATION = 'RECEIVE_CONVERSATION';
export const REQUEST_CONVERSATION_MESSAGES = 'REQUEST_CONVERSATION_MESSAGES';
export const RECEIVE_CONVERSATION_MESSAGES = 'RECEIVE_CONVERSATION_MESSAGES';

const socket = IO();

//
// Connection
//

export function requestConnection() {
    return {
        type: REQUEST_CONNECTION
    };
};

export function receiveConnection() {
    return {
        type: RECEIVE_CONNECTION
    };
};

export function fetchConnection() {
    return dispatch => {
        dispatch(requestConnection());
        return socket.on('connect', function() {
            dispatch(receiveConnection());
            dispatch(fetchRooms());
        });
    };
};

//
// Rooms
//

export function requestRooms() {
    return {
        type: REQUEST_ROOMS
    };
};

export function receiveRooms(rooms) {
    return {
        type: RECEIVE_ROOMS,
        rooms
    };
};

export function fetchRooms() {
    return dispatch => {
        dispatch(requestRooms());
        return socket.emit('rooms:list', { users: true }, function(rooms) {
            dispatch(receiveRooms(rooms));
        });
    };
};

//
// Coversation
//

export function requestConversation(id) {
    return {
        type: REQUEST_CONVERSATION,
        id
    };
};

export function receiveConversation(conversation) {
    return {
        type: RECEIVE_CONVERSATION,
        ...conversation
    };
};

export function fetchConversation(id) {
    return dispatch => {
        dispatch(requestConversation());
        return socket.emit('rooms:get', {
            id
        }, function(room) {
            dispatch(receiveConversation(room));
            dispatch(fetchConversationMessages(id));
        });
    };
};

export function requestConversationMessages(id) {
    return {
        type: REQUEST_CONVERSATION_MESSAGES,
        id
    };
};

export function receiveConversationMessages(messages) {
    return {
        type: RECEIVE_CONVERSATION_MESSAGES,
        messages
    };
};

export function fetchConversationMessages(id) {
    return dispatch => {
        dispatch(requestConversationMessages());
        return socket.emit('messages:list', {
            room: id,
            take: 500,
            expand: 'owner',
            reverse: true
        }, function(messages) {
            dispatch(receiveConversationMessages(messages));
        });
    };
};
