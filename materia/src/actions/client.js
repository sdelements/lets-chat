'use strict';

import { socket } from '../services/io';

export const CLIENT_CONNECTED = 'CLIENT_CONNECTED';
export const CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED';

export const CLIENT_ERROR = 'CLIENT_ERROR';

export const REQUEST_WHO_AM_I = 'REQUEST_WHO_AM_I';
export const RECEIVE_WHO_AM_I = 'RECEIVE_WHO_AM_I';

export function clientConnected() {
    return {
        type: CLIENT_CONNECTED
    };
};

export function clientDisconnected() {
    return {
        type: CLIENT_DISCONNECTED
    };
};

export function clientError(error) {
    return {
        type: CLIENT_ERROR,
        error
    };
}

export function requestWhoAmI() {
    return {
        type: REQUEST_WHO_AM_I
    }
}
export function receiveWhoAmI(user) {
    return {
        type: RECEIVE_WHO_AM_I,
        user
    }
}

export function fetchWhoAmI() {
    return dispatch => {
        dispatch(requestWhoAmI());
        return socket.emit('account:whoami', function(user) {
            dispatch(receiveWhoAmI(user));
        });
    };
}
