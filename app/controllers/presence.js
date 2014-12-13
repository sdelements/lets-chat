'use strict';

var util = require('util'),
    Connection = require('./../core/presence').Connection;

function SocketIoConnection(userId, socket) {
    Connection.call(this, 'socket.io', userId);
    this.socket = socket;
    socket.conn = this;
    socket.on('disconnect', this.disconnect.bind(this));
}

util.inherits(SocketIoConnection, Connection);

SocketIoConnection.prototype.disconnect = function() {
    this.emit('disconnect');

    this.socket.conn = null;
    this.socket = null;
};

module.exports = function() {
    var app = this.app,
        core = this.core;

    app.io.sockets.on('connection', function(socket) {
        var userId = socket.handshake.session.userID;
        core.presence.connect(new SocketIoConnection(userId, socket));
    });
};
