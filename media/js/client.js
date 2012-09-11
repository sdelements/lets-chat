var Client = function(config) {

    var self = this;
    
    //
    // Config
    //
    this.config = config;

    //
    // Global Notifications
    //
    this.notifications = _.extend({}, Backbone.Events);
    
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
        availableRooms: this.availableRooms,
        rooms: this.rooms,
        notifications: this.notifications
    });

    //
    // Chat actions
    //
    this.joinRoom = function(id, switchRoom) {
        self.socket.emit('room:join', id, function(room) {
            self.rooms.add(room);
            self.getRoomHistory({
                room: id
            });
            self.getRoomUsers({
                room: id
            });
            if (switchRoom) {
                self.view.switchView(id)
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
    this.getRoomHistory = function(options) {
        self.socket.emit('room:messages:get', {
            room: options.room
        });
    }
    this.getRoomUsers = function(options) {
        self.socket.emit('room:users:get', {
            room: options.room
        });
    }
    this.addUser = function(data) {
        var add = function(user) {
            var room = self.rooms.get(user.room);
            room.users.add(user);
        }
        if ($.isArray(data)) {
            _.each(data, add);
        } else {
            add(data);
        }
    }
    this.removeUser = function(user) {
        var room = self.rooms.get(user.room);
        if (room) {
            var user = room.users.get(user.id)
            room.users.remove(user);
        }
    }
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
            // We only trigger this event for new single messages
            self.notifications.trigger('addmessage', data);
        }
    }
    this.sendMessage = function(message) {
        self.socket.emit('room:messages:new', message);
    }
    this.deleteRoom = function(id) {
        self.socket.emit('room:delete', id);
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
            self.socket.emit('rooms:get', {});
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
        self.socket.on('room:remove', function(id) {
            self.leaveRoom(id);
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
        this.listen();
        this.route();
        this.viewListen();
        return this;
    }

}
