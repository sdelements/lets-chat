var Client = function(config) {

    var self = this;

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
        self.socket.emit('rooms:join', id, function(room) {
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
        self.socket.emit('rooms:leave', id);
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
        self.socket.emit('messages:get', {
            room: options.room
        });
    }
    this.getRoomUsers = function(options) {
        self.socket.emit('users:get', {
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
            console.log(room.users);
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
        }
    }
    this.sendMessage = function(message) {
        self.socket.emit('messages:new', message);
    }

    //
    // Connection
    //
    this.listen = function() {
        self.socket = io.connect(config.host, {
            reconnect: true,
            transports: config.transports
        });
        self.socket.on('connect', function() {
            self.socket.emit('rooms:list', {});
        });
        self.socket.on('messages:new', function(message) {
            self.addMessage(message);
        });
        self.socket.on('users:new', function(user) {
            self.addUser(user);
        });
        self.socket.on('users:leave', function(user) {
            self.removeUser(user);
        });
        self.socket.on('rooms:new', function(room) {
            self.availableRooms.add(room);
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
