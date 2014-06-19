//
// LCB Client
//

+function(window, $, _) {

    //
    // Base
    //
    var Client = function(config) {
        this.config = config;
        this.status = new Backbone.Model;
        this.user = new UserModel;
        this.users = new UsersCollection;
        this.rooms = new RoomsCollection;
        this.events = _.extend({}, Backbone.Events);
        return this;
    };

    //
    // Account
    //
    Client.prototype.getUser = function() {
        var that = this;
        this.socket.emit('account:whoami', function(user) {
            that.user.set(user);
        });
    };

    //
    // Rooms
    //
    Client.prototype.createRoom = function(data) {
        var that = this;
        var room = {
            name: data.name,
            description: data.description
        };
        var callback = data.callback;
        this.socket.emit('rooms:create', room, function(room) {
            if (room && room.id) {
                that.rooms.add(room);
                that.switchRoom(room.id);
            }
            callback && callback(room);
        });
    };
    Client.prototype.deleteRoom = function(id) {
        var room = this.rooms.get(id);
        if (room) {
            this.socket.emit('rooms:delete', id, function() {
                that.rooms.remove(room);
            });
        }
    };
    Client.prototype.getRooms = function() {
        var that = this;
        this.socket.emit('rooms:list', function(rooms) {
            that.rooms.set(rooms);
        });
    };
    Client.prototype.switchRoom = function(id) {
        // Make sure we have a last known room ID
        this.rooms.last.set('id', this.rooms.current.get('id'));
        if (!id || id == 'list') {
            this.rooms.current.set('id', 'list');
            return;
        }
        var room = this.rooms.get(id);
        if (room && room.get('joined')) {
            this.router.navigate('!/room/' + room.id, {
                replace: true
            });
            this.rooms.current.set('id', id);
            return;
        } else {
            this.joinRoom(id, true);
        }
    }
    Client.prototype.updateRoom = function(room) {
        this.socket.emit('rooms:update', room);
    }
    Client.prototype.roomUpdate = function(resRoom) {
        var room = this.rooms.get(resRoom.id);
        if (!room) {
            // Nothing to do
            return;
        }
        room.set(resRoom);
    }
    Client.prototype.joinRoom = function(id, switchRoom) {
        var that = this;
        // We need an id and unlocked joining
        if (!id || _.contains(this.joining, id)) {
            // Nothing to do
            return;
        }
        //
        // Setup joining lock
        //
        this.joining = this.joining || [];
        this.joining.push(id);
        this.socket.emit('rooms:join', id, function(resRoom) {
            var room = that.rooms.get(id);
            room = that.rooms.add(resRoom);
            room.set('joined', true);
            // Get room history
            that.getMessages({
                room: room.id,
                limit: 480,
                from: room.lastMessage.get('id')
            }, function(messages) {
                that.addMessages(messages, !room.get('loaded'));
                room.set('loaded', true);
            });
            // Get room users
            that.getUsers({
                room: room.id
            }, _.bind(that.setUsers, that));
            // Do we want to switch?
            if (switchRoom) {
                that.switchRoom(id);
            }
            //
            // Add room id to localstorage so we can reopen it on refresh
            //
            var openRooms = store.get('openrooms');
            if (openRooms instanceof Array) {
                // Check for duplicates
                if (!_.contains(openRooms, id)) {
                    openRooms.push(id);
                }
                store.set('openrooms', openRooms);
            } else {
                store.set('openrooms', [id]);
            }
        });
        // Remove joining lock
        _.defer(function() {
            that.joining = _.without(that.joining, id);
        });
    }
    Client.prototype.leaveRoom = function(id) {
        var room = this.rooms.get(id);
        if (room) {
            room.set('joined', false);
            room.users.reset();
        }
        this.socket.emit('rooms:leave', id);
        if (id == this.rooms.current.get('id')) {
            var room = this.rooms.get(this.rooms.last.get('id'));
            this.switchRoom(room && room.id);
        }
        // Remove room id from localstorage
        store.set('openrooms', _.without(store.get('openrooms'), id));
    }
    //
    // Messages
    //
    Client.prototype.addMessage = function(message) {
        var room = this.rooms.get(message.room);
        if (!room || !message) {
            // Unknown room, nothing to do!
            return;
        }
        room.lastMessage.set(message);
        room.trigger('messages:new', message);
    }
    Client.prototype.addMessages = function(messages, historical) {
        _.each(messages, function(message) {
            historical && (message.historical = true);
            this.addMessage(message);
        }, this);
    }
    Client.prototype.sendMessage = function(message) {
        this.socket.emit('messages:create', message, _.bind(this.addMessage, this));
    }
    Client.prototype.getMessages = function(query, callback) {
        this.socket.emit('messages:list', query, callback)
    }
    //
    // Users
    //
    Client.prototype.setUsers = function(users) {
        if (!users || !users[0].room) {
            // Data is not valid
            return;
        }
        var room = this.rooms.get(users[0].room);
        if (!room) {
            // No room
            return;
        }
        room.users.set(users);
    }
    Client.prototype.addUser = function(user) {
        var room = this.rooms.get(user.room);
        if (!room) {
            // No room
            return;
        }
        room.users.add(user);
    }
    Client.prototype.removeUser = function(user) {
        var room = this.rooms.get(user.room);
        if (!room) {
            // No room
            return;
        }
        room.users.remove(user.id);
    }
    Client.prototype.getUsers = function(id, callback) {
        var that = this;
        if (!id) {
            this.socket.emit('users:list', function(users) {
                that.users.set(users);
                callback && callback(users);
            });
            return;
        }
        this.socket.emit('users:list', id, callback);
    };

    //
    // Router Setup
    //
    Client.prototype.route = function() {
        var that = this;
        var Router = Backbone.Router.extend({
            routes: {
                '!/room/': 'list',
                '!/room/:id': 'join',
                '*path': 'list'
            },
            join: function(id) {
                that.switchRoom(id);
            },
            list: function() {
                that.switchRoom('list');
            }
        });
        this.router = new Router;
        Backbone.history.start();
    }
    //
    // Listen
    //
    Client.prototype.listen = function() {
        var that = this;
        //
        // Socket
        //
        this.socket = io.connect(null, {
            reconnect: true
        });
        this.socket.on('connect', function() {
            that.getUser();
            that.getUsers();
            that.getRooms();
            that.status.set('connected', true);
        });
        this.socket.on('reconnect', function() {
            _.each(that.rooms.where({ joined: true }), function(room) {
                that.joinRoom(room.id);
            });
        });
        this.socket.on('messages:new', function(message) {
            that.addMessage(message);
        });
        this.socket.on('rooms:create', function(data) {
            that.createRoom(data);
        });
        this.socket.on('rooms:update', function(room) {
            that.roomUpdate(room);
        });
        this.socket.on('users:join', function(user) {
            that.addUser(user);
        });
        this.socket.on('users:leave', function(user) {
            that.removeUser(user);
        });
        this.socket.on('disconnect', function() {
            that.status.set('connected', false);
        });
        //
        // GUI
        //
        this.events.on('messages:send', this.sendMessage, this);
        this.events.on('rooms:update', this.updateRoom, this);
        this.events.on('rooms:leave', this.leaveRoom, this);
        this.events.on('rooms:create', this.createRoom, this);
        this.events.on('rooms:switch', this.switchRoom, this);
    }
    //
    // Start
    //
    Client.prototype.start = function() {
        this.listen();
        this.route();
        this.view = new ClientView({
            client: this
        });
        //
        // Join rooms from localstorage
        //
        var openRooms = store.get('openrooms');
        if (openRooms instanceof Array) {
            // Flush the stored array
            store.set('openrooms', [])
            // Let's open some rooms!
            _.each(_.uniq(openRooms), function(id) {
                this.joinRoom(id);
            }, this);
        }
        return this;
    }
    //
    // Add to window
    //
    window.LCB = window.LCB || {};
    window.LCB.Client = Client;
}(window, $, _);
