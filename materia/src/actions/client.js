'use strict';

export const CLIENT_CONNECTED = 'CLIENT_CONNECTED';
export const CLIENT_DISCONNECTED = 'CLIENT_DISCONNECTED';

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
