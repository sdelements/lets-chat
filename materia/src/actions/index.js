'use strict';

const REQUEST_CONNECTION = 'REQUEST_CONNECTION';
const RECEIVE_CONNECTION = 'RECEIVE_CONNECTION';

const REQUEST_ROOMS = 'REQUEST_ROOMS';
const RECEIVE_ROOMS = 'RECEIVE_ROOMS';

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
        dispatch(fetchRooms());
        return dispatch(receiveConnection());
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
        return dispatch(receiveRooms());
    };
};
