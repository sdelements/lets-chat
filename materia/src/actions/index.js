'use strict';

import IO from 'socket.io-client';

export const REQUEST_CONNECTION = 'REQUEST_CONNECTION';
export const RECEIVE_CONNECTION = 'RECEIVE_CONNECTION';
export const REQUEST_ROOMS = 'REQUEST_ROOMS';
export const RECEIVE_ROOMS = 'RECEIVE_ROOMS';

const socket = IO();

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

export function requestRooms() {
    return {
        type: REQUEST_ROOMS
    };
};

export function receiveRooms(rooms) {
    return {
        type: RECEIVE_ROOMS,
        rooms: rooms
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
