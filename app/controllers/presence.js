'use strict';

var util = require('util'),
    Connection = require('./../core/presence').Connection;

function SocketIoConnection(user, socket) {
    Connection.call(this, 'socket.io', user);
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
        core = this.core,
        User = this.models.user;

    app.io.on('connection', function(socket) {
        var userId = socket.request.user._id;
        User.findById(userId, function (err, user) {
            if (err) {
                console.error(err);
                return;
            }
            var conn = new SocketIoConnection(user, socket);
            core.presence.connect(conn);
        });
    });
};
