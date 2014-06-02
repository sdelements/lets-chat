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
        this.rooms = new RoomsCollection;
        this.events = _.extend({}, Backbone.Events);
        return this;
    }
    //
    // Account
    //
    Client.prototype.getUser = function() {
        var that = this;
        this.socket.emit('account:whoami', function(user) {
            that.user.set(user);
        });
    }
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
            that.rooms.add(room);
            that.switchRoom(room.id);
            callback && callback();
        });
    }
    Client.prototype.getRooms = function() {
        var that = this;
        this.socket.emit('rooms:list', function(rooms) {
            that.rooms.set(rooms);
        });
    }
    Client.prototype.getRoomUsers = function(id) {
        var room = this.rooms.get(id);
        if (room) {
            this.socket.emit('rooms:users', id, function(users) {
                room.users.set(users);
            });
        }
    }
    Client.prototype.switchRoom = function(id) {
        // Make sure we have a last known room ID
        this.rooms.last.set('id', this.rooms.current.get('id'));
        if (!id || id == 'list') {
            this.rooms.current.set('id', 'list');
            return;
        }
        var room = this.rooms.get(id);
        if (room && room.get('joined')) {
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
        if (!id) {
            // Nothing to do
            return;
        }
        this.socket.emit('rooms:join', id, function(resRoom) {
            var room = that.rooms.add(resRoom);
            room.set('joined', true);
            if (switchRoom) {
                that.rooms.current.set('id', id);
            }
        });
    }
    Client.prototype.leaveRoom = function(id) {
        var room = this.rooms.get(id);
        if (room) {
            room.set('joined', false);
        }
        this.socket.emit('rooms:leave', id);
        if (id == this.rooms.current.get('id')) {
            var room = this.rooms.get(this.rooms.last.get('id'));
            var uri = room && room.get('joined') == true ? '!/room/' + room.id : '!/';
            this.router.navigate(uri, {
                trigger: true,
                replace: true
            });
        }
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
        room.trigger('messages:new', message);
    }
    Client.prototype.sendMessage = function(message) {
        this.socket.emit('messages:create', message, _.bind(this.addMessage, this));
    }
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
            that.getRooms();
            that.status.set('connected', true);
        });
        this.socket.on('messages:new', function(message) {
            that.addMessage(message);
        });
        this.socket.on('rooms:create', function(data) {
            that.createRoom(data);
        });
        this.socket.on('rooms:leave', function(id) {
            that.leaveRoom(id);
        });
        this.socket.on('rooms:update', function(room) {
            that.roomUpdate(room);
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
        this.events.on('rooms:create', this.createRoom, this)
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
        return this;
    }
    //
    // Add to window
    //
    window.LCB = window.LCB || {};
    window.LCB.Client = Client;
}(window, $, _);
