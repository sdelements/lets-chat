//
// LCB Client
//

+function(window, $, _) {
    //
    // Base
    //
    var Client = function(config) {
        this.config = config;
        this.user = new UserModel;
        this.rooms = new RoomsCollection;
        this.events = _.extend({}, Backbone.Events);
        return this;
    }
    //
    // Rooms
    //
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
        var room = this.rooms.get(id);
        if (room && room.get('joined')) {
            this.rooms.current.set('id', id);
            return;
        } else {
            this.joinRoom(id, true)
        }
    }
    Client.prototype.joinRoom = function(id, switchRoom) {
        var that = this;
        if (!id) {
            // nothing to do
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
        this.socket.emit('rooms:leave', id, function() {
            // TODO: Do we need to wait for a response?
        });
    }
    //
    // Messages
    //
    Client.prototype.addMessage = function(message) {
        var room = this.rooms.get(message.room);
        if (!room) {
            // Unknown room, nothing to do!
            return;
        }
        room.trigger('messages:new', message);
    }
    Client.prototype.sendMessage = function(message) {
        this.socket.emit('messages:create', message);
    }
    //
    // Router Setup
    //
    Client.prototype.route = function() {
        var that = this;
        var Router = Backbone.Router.extend({
            routes: {
                '!/room/home': 'list',
                '!/room/:id': 'join',
                '*path': 'list'
            },
            join: function(id) {
                that.switchRoom(id);
            },
            list: function() {
                that.switchRoom();
            }
        });
        that.router = new Router;
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
            that.getRooms();
        });
        this.socket.on('messages:new', function(message) {
            that.addMessage(message);
        });
        this.socket.on('rooms:leave', function(id) {
            that.leaveRoom(id);
        });
        this.socket.on('disconnect', function() {
            console.log('disconnected');
        });
        //
        // GUI
        //
        this.events.on('messages:send', this.sendMessage, this);
        this.events.on('rooms:leave', this.leaveRoom, this);
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