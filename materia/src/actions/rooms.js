'use strict';

import { socket } from '../services/io';

export const REQUEST_ROOMS = 'REQUEST_ROOMS';
export const RECEIVE_ROOMS = 'RECEIVE_ROOMS';

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
