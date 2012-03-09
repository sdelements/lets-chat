//
// Letschatbro Server
//


var async = require('async');
var mongoose = require('mongoose');
var parseCookie = require('connect').utils.parseCookie;
var Session = require('connect').middleware.session.Session;

var MessageModel = require('./models/message.js');
var User = require('./models/auth.js');

var ChatServer = function (app, sessionStore) {
    var self = this;

    this.clients = {};

    this.init = function () {
        console.log('Starting up bro...');
        mongoose.connect('mongodb://localhost/letschatbro');
        this.io = require('socket.io').listen(app);
        this.io.set('log level', 0);
        this.io.set('authorization', function (data, accept) {
            // This function, courtesy of danielbaulig.de, will parse out session
            // info for connections.
            if (data.headers.cookie) {
                // if there is, parse the cookie
                data.cookie = parseCookie(data.headers.cookie);
                data.sessionID = data.cookie['express.sid'];
                data.sessionStore = sessionStore;
                sessionStore.get(data.sessionID, function (err, session) {
                    if (err || !session) {
                        accept("Error with Sessions", false);
                    } else {
                        data.session = new Session(data, session);
                        accept(null, true);
                    }
                });
            } else {
                // if there isn't, turn down the connection
                return accept('No cookie transmitted.', false);
            }
        });
        // Setup listeners
        this.setupListeners();
    };

    this.setupListeners = function () {
        // New client
        this.io.sockets.on('connection', function (client) {
            console.log('What a nice client bro...');
            var hs = client.handshake;
            var userData = hs.session.user;
            // TODO: Do we need to use private ID here?
            User.findById(userData._id, function (err, user) {
                self.clients[client.id] = {
                    user: user,
                    sid: null
                };
                self.sendClientList();
            });

            // Bind ping
            client.on('ping', function (data) {
                client.emit('ping', {});
            });

            client.on('message', function (data) {
                data.ownerID = userData._id;
                // Send message to everyone
                self.io.sockets.emit('message', data);
                self.saveMessage(data);
            });

            client.on('message history', function (data) {
                self.sendMessageHistory(client);
            });

            client.on('set name', function (data) {
                var user = self.clients[client.id].user;
                user.displayName = data.name;
                user.save();
                self.sendClientList(); // TODO: Change this to a general change
            });

            client.on('disconnect', function () {
                delete self.clients[client.id];
                self.sendClientList();
            });

            console.log('Sending message');

            // Send off an announcement
            self.io.sockets.emit('join', {
                name: 'System',
                text: userData.displayName + '(' + userData.firstName + ' '  +
                           userData.lastName + ') Signed in'
            });

            console.log('Done');
        });

    };

    this.sendClientList = function () {
        self.io.sockets.emit('user list', { users: self.clients });
    };

    this.sendMessageHistory = function (client, query) {
        MessageModel.find().limit(30).sort('posted', -1).run(function (err, docs) {
            var data = [];
            docs.forEach(function (doc) {
                data.push({
                    // TODO: Do we need to use private ID here?
                    id: doc._id,
                    name: doc.owner,
                    text: doc.text,
                    posted: doc.posted,
                    ownerID: doc.ownerID
                });
            });
            data.reverse();
            client.emit('message history', data);
        });
    };

    this.saveMessage = function (message) {
        new MessageModel({
            ownerID: message.ownerID,
            owner: message.name, // TODO: Take this out and use only ID
            text: message.text
        }).save();
    };

    // Cleanup
    this.die = function () {
        console.log('Holy shit bro, we goin down...');
    };

    this.init();
};

module.exports = ChatServer;
