'use strict';

import _ from 'lodash';

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

export function receiveConversation(id, conversation) {
    return {
        type: RECEIVE_CONVERSATION,
        id,
        conversation
    };
};

export function joinConversation(id) {
    return (dispatch, getState) => {
        dispatch(requestConversation(id));
        const conversations = getState().conversations.items;
        const conversation = _.find(conversations, { id })
        if (conversation && conversation.isJoined) {
            return dispatch(receiveConversation(id, conversation));
        }
        return socket.emit('rooms:join', id, function(room) {
            dispatch(receiveConversation(id, room));
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

export function receiveConversationMessages(id, messages) {
    return {
        type: RECEIVE_CONVERSATION_MESSAGES,
        id,
        messages
    };
};

export function fetchConversationMessages(id) {
    return (dispatch, getState) => {
        dispatch(requestConversationMessages(id));
        const { conversations } = getState();
        const { messages = [] } = _.find(conversations.items, {
            id
        });
        if (messages.length > 0) {
            return dispatch(receiveConversationMessages(id, messages));
        }
        return socket.emit('messages:list', {
            room: id,
            take: 200,
            expand: 'owner',
            reverse: true
        }, function(messages) {
            dispatch(receiveConversationMessages(id, messages));
        });
    };
};

export function attemptConversationMessage(id, message) {
    return {
        type: ATTEMPT_CONVERSATION_MESSAGE,
        id,
        message
    };
};

export function confirmConversationMessage(id, message) {
    return {
        type: CONFIRM_CONVERSATION_MESSAGE,
        id,
        message
    };
};

export function receiveConversationMessage(id, message) {
    return {
        type: RECEIVE_CONVERSATION_MESSAGE,
        id,
        message
    };
};

export function sendConversationMessage(id, message) {
    return dispatch => {
        dispatch(attemptConversationMessage(id, message))
        return socket.emit('messages:create', {
            room: id,
            ...message
        }, function(confirmedMessage) {
            dispatch(confirmConversationMessage(id, confirmedMessage));
        });
    };
};
