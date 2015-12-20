'use strict';

import { socket } from '../services/io';

export const REQUEST_CONVERSATION = 'REQUEST_CONVERSATION';
export const RECEIVE_CONVERSATION = 'RECEIVE_CONVERSATION';
export const REQUEST_CONVERSATION_MESSAGES = 'REQUEST_CONVERSATION_MESSAGES';
export const RECEIVE_CONVERSATION_MESSAGES = 'RECEIVE_CONVERSATION_MESSAGES';
export const ATTEMPT_CONVERSATION_MESSAGE = 'ATTEMPT_CONVERSATION_MESSAGE';
export const CONFIRM_CONVERSATION_MESSAGE = 'CONFIRM_CONVERSATION_MESSAGE';
export const RECEIVE_CONVERSATION_MESSAGE = 'RECEIVE_CONVERSATION_MESSAGE';

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

export function joinConversation(id) {
    return dispatch => {
        dispatch(requestConversation());
        return socket.emit('rooms:join', id, function(room) {
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

export function attemptConversationMessage(message) {
    return {
        type: ATTEMPT_CONVERSATION_MESSAGE,
        message
    };
};

export function confirmConversationMessage(message) {
    return {
        type: CONFIRM_CONVERSATION_MESSAGE,
        message
    };
};

export function receiveConversationMessage(message) {
    return {
        type: RECEIVE_CONVERSATION_MESSAGE,
        message
    };
};

export function sendConversationMessage(message) {
    return dispatch => {
        return socket.emit('messages:create', message, function(confirmedMessage) {
            dispatch(confirmConversationMessage(confirmedMessage));
        });
    };
};
