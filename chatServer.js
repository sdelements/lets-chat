// Letschatbro Server
// libraries
var async = require('async');
var mongoose = require('mongoose');
var parseCookie = require('connect').utils.parseCookie
var Session = require('connect').middleware.session.Session
// Load models
var MessageModel = require('./models/message.js');

var ChatServer = function (app, sessionStore) {

	var self = this;
	
	// Setup vars
	this.clients = {};

	this.init = function() {

		console.log('Starting up bro...');
        // connect to db
        mongoose.connect('mongodb://localhost/letschatbro');
		// Listening
		this.io = require('socket.io').listen(app);
	    this.io.set('log level', 0)
        // This will parse out session info for connections
        this.io.set('authorization', function (data, accept) {
            // This function courtesy of danielbaulig.de
            // check if there's a cookie header
            if (data.headers.cookie) {
                // if there is, parse the cookie
                data.cookie = parseCookie(data.headers.cookie);
                data.sessionID = data.cookie['express.sid'];
                data.sessionStore = sessionStore
                sessionStore.get(data.sessionID, function (err, session) {
                    if (err || !session) {
                        accept("Error with Sessions", false)
                    } else {
                        data.session = new Session(data, session)
                        accept(null, true)
                    }
                })   
            } else {
                // if there isn't, turn down the connection
                return accept('No cookie transmitted.', false);
            }
        })
		// Setup listeners
		this.setupListeners();

	}

	this.setupListeners = function () {

		// New client
		this.io.sockets.on('connection', function (client) {
            console.log(client.handshake.session)
			console.log('What a nice client bro...');
            var hs = client.handshake
            var user = hs.session.user
			// Add to clients list
			self.clients[client.id] = {
                name: user.displayName,
                user: user,
				sid: null
			}
			self.sendClientList();

			// Bind ping
			client.on('ping', function(data) {
				client.emit('ping', {});
				console.log('Got ping...');
			});

			client.on('message', function(data) {
				// Send message to everyone
				self.io.sockets.emit('message', data);
				self.saveMessage(data);
			});

			client.on('message history', function(data) {
				self.sendMessageHistory(client);
			});
			
			client.on('set name', function(data) {
				self.clients[client.id].name = data.name;
				self.sendClientList(); // TODO: Change this to a general change
			});

			client.on('disconnect', function() {
				delete self.clients[client.id];
				self.sendClientList();
			});
    
            console.log("Send off message")
			// Send off an announcement
			self.io.sockets.emit('join', {
				name: 'System',
				text: 'A wild Dude appears!'
			});

            console.log("Done")

		});

	}
	
	this.sendClientList = function() {
		self.io.sockets.emit('user list', { users: self.clients });
	}

	this.sendMessageHistory = function(client, query) {
		MessageModel.find().limit(30).sort('posted', -1).run(function(err, docs) {
			var data = [];
			docs.forEach(function(doc) {
				data.push({
					id: doc._id,
					name: doc.owner,
					text: doc.text,
					posted: doc.posted
				})
			});
			client.emit('message history', data);
		});
	}

	this.saveMessage = function(message) {
		console.log('Saving message...');
		new MessageModel({
			owner: message.name,
			text: message.text
		}).save();
	} 

	// Cleanup
	this.die = function() {
		console.log('Holy shit bro, we goin down...');
	}

    this.init()
}

module.exports = ChatServer
