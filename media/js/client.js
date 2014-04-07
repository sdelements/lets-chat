var Client = function(config) {

    var self = this;

    //
    // Config
    //
    this.config = config;

    //
    // Plugins
    //
    this.plugins = {};

    //
    // Global Notifications
    //
    this.notifications = _.extend({}, Backbone.Events);

    //
    // Client User
    //
    this.user = new UserModel();

    //
    // Available Rooms Collections
    //
    this.availableRooms = new AvailableRoomsCollection();

    //
    // Rooms Collection
    //
    this.rooms = new RoomsCollection();

    //
    // Client View
    //
    this.view = new ClientView({
        config: this.config,
        user: this.user,
        availableRooms: this.availableRooms,
        rooms: this.rooms,
        notifications: this.notifications,
        plugins: this.plugins
    });

    //
    // Chat actions
    //
    this.joinRoom = function(id, switchRoom) {
        self.socket.emit('room:join', id, function(room) {
            var existingRoom = self.rooms.get(id);
            if (existingRoom) {
                existingRoom.users.reset();
                var lastMessageModel = existingRoom.messages.at(existingRoom.messages.length - 1);
            } else {
                self.rooms.add(room);
            }
            // Get room data
            self.getRoomUsers({
                room: id
            });
            // Do we need to resync?
            if (lastMessageModel && lastMessageModel.id) {
                self.getRoomHistory({
                    room: id,
                    from: lastMessageModel.id
                }, function(messages) {
                    _.each(messages, self.addMessage);
                });
            }
            // Fresh room stuffs
            // TODO: These few lines can be merged with above
            if (!existingRoom) {
                self.getRoomHistory({
                    room: id
                });
                self.getRoomFiles({
                    room: id
                });
            }
            // Do we want to show this room?
            if (switchRoom) {
                self.view.switchView(id);
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
    }
    this.createRoom = function (room, switchRoom) {
        self.socket.emit('rooms:create', room)
    }
    this.leaveRoom = function(id) {
        var room = self.rooms.get(id);
        self.rooms.remove(room);
        self.socket.emit('room:leave', id);
        //
        // Remove room id from localstorage
        //
        store.set('openrooms', _.without(store.get('openrooms'), id));
    }
    this.switchRoom = function(id) {
        var room = self.rooms.get(id);
        if (room) {
            self.view.switchView(id);
        } else if (!id) {
            self.view.switchView('home');
        } else {
            self.joinRoom(id, true);
        }
    }
    this.getRoomHistory = function(query, callback) {
        self.socket.emit('room:messages:get', query, callback || false);
    }
    this.getRoomUsers = function(options) {
        self.socket.emit('room:users:get', {
            room: options.room
        });
    }
    this.getRoomFiles = function(options) {
        self.socket.emit('room:files:get', {
            room: options.room
        });
    }
    this.addUser = function(data) {
        var add = function(user) {
            var room = self.rooms.get(user.room);
            if (room)
                room.users.add(user);
        }
        if ($.isArray(data)) {
            _.each(data, add);
        } else {
            add(data);
        }
    }
    this.updateUser = function(user) {
        self.notifications.trigger('updateuser', user);
    }
    this.removeUser = function(user) {
        var room = self.rooms.get(user.room);
        if (room) {
            var user = room.users.get(user.id)
            room.users.remove(user);
        }
    }
    this.addFile = function(file) {
        var room = self.rooms.get(file.room);
        if (room) {
            room.files.add(file);
        }
    };
    this.addMessage = function(data) {
        if ($.isArray(data)) {
            _.each(data, function(message) {
                var room = self.rooms.get(message.room);
                room.messages.add(message, {
                    silent: true
                });
                room.messages.trigger('addsilent', message);
            });
        } else {
            var room = self.rooms.get(data.room);
            room.messages.add(data);
            data.roomName = room.get('name');
            // We only trigger this event for new single messages
            self.notifications.trigger('addmessage', data);
        }
    }
    this.sendMessage = function(message) {
        self.socket.emit('room:messages:new', message);
    }
    this.updateRoom = function(data) {
        self.socket.emit('room:update', data);
    }
    this.deleteRoom = function(id) {
        self.socket.emit('room:delete', id);
    }
    this.loadPlugins = function() {
        $.get('/plugins/replacements.json', function(json) {
            self.plugins.replacements = json;
            self.notifications.trigger('replacements.update');
        });
        $.get('/plugins/emotes.json', function(json) {
            self.plugins.emotes = json;
            self.notifications.trigger('emotes.update');
        });
    }

    //
    // Connection
    //
    this.listen = function() {
        self.socket = io.connect(self.config.host, {
            reconnect: true,
            transports: self.config.transports
        });
        self.socket.on('connect', function() {
            // Grab plugins
            self.loadPlugins();
            // Reset keeps available rooms in sync
            self.availableRooms.reset();
            // Grab global data
            self.socket.emit('user:whoami');
            self.socket.emit('rooms:get');
            // If we have rooms we'll need to rejoin
            if (self.rooms.length > 0) {
                self.rooms.each(function(room) {
                    self.joinRoom(room.id);
                });
            }
            self.notifications.trigger('connect');
        });
        self.socket.on('disconnect', function() {
            self.notifications.trigger('disconnect');
        });
        self.socket.on('user:whoami', function(profile) {
            self.user.set(profile);
        });
        self.socket.on('user:update', function(profile) {
            self.updateUser(profile);
        });
        self.socket.on('room:messages:new', function(message) {
            self.addMessage(message);
        });
        self.socket.on('room:users:new', function(user) {
            self.addUser(user);
        });
        self.socket.on('room:users:leave', function(user) {
            self.removeUser(user);
        });
        self.socket.on('room:files:new', function(file) {
            self.addFile(file);
        });
        self.socket.on('room:remove', function(id) {
            self.leaveRoom(id);
        });
        self.socket.on('room:update', function(data) {
            var room = self.rooms.get(data.id);
            var availableRoom = self.availableRooms.get(data.id);
            if (room) {
                room.set(_.extend(room.toJSON(), data));
            }
            if (availableRoom) {
                availableRoom.set(_.extend(availableRoom.toJSON(), data));
            }
            self.notifications.trigger('roomupdate', _.extend(availableRoom.toJSON(), data));
        });
        self.socket.on('rooms:new', function(room) {
            self.availableRooms.add(room);
        });
        self.socket.on('rooms:remove', function(room) {
            self.availableRooms.remove(room);
        });
        self.socket.on('rooms:users:new', function(user) {
            var room = self.availableRooms.get(user.room)
            if (room) {
                room.users.add(user);
            }
        });
        self.socket.on('rooms:users:leave', function(user) {
            var room = self.availableRooms.get(user.room)
            if (room) {
                room.users.remove(room.users.get(user.id));
            }
        });
    }

    //
    // Router
    //
    this.route = function() {
        var Router = Backbone.Router.extend({
            routes: {
                '!/room/home': 'list',
                '!/room/:id': 'join',
                '*path': 'list'
            },
            join: function(id) {
                self.switchRoom(id)
            },
            list: function() {
                self.switchRoom();
            }
        });
        self.router = new Router;
        Backbone.history.start();
    }

    //
    // Bubbled View events
    //
    this.viewListen = function() {
        this.notifications.on('createroom', function(room) {
            self.createRoom(room);
        });
        this.notifications.on('newmessage', function(message) {
            self.sendMessage(message);
        });
        this.notifications.on('tabclosed', function(data) {
            self.leaveRoom(data.id);
        });
        this.notifications.on('updateroom', function(data) {
            self.updateRoom(data);
        });
        this.notifications.on('deleteroom', function(id) {
            self.deleteRoom(id);
        });
        this.notifications.on('navigate', function(id) {
            self.router.navigate('!/room/'+ id, {
                trigger: true,
                replace: true
            });
        });
    }

    //
    // Lets go
    //
    this.start = function() {
        var self = this;
        this.loadPlugins();
        this.listen();
        this.route();
        this.viewListen();
        //
        // Join rooms from localstorage
        //
        var openRooms = store.get('openrooms');
        if (openRooms instanceof Array) {
            // Flush the stored array
            store.set('openrooms', [])
            // Let's open some rooms!
            _.each(_.uniq(openRooms), function(id) {
                self.joinRoom(id);
            });
        }
        return this;
    }

}
