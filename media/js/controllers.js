var Client = function(config) {

    var self = this;

    //
    // Global Notifications
    //
    this.notifications = {}
    _.extend(this.notifications, Backbone.Events);
    
    //
    // Room Collection
    //
    this.rooms = new RoomsCollection();
    
    //
    // Client View
    //
    this.view = new ClientView({
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
            if (switchRoom) {
                self.view.switchView(id)
            }
        });
    }
    this.leaveRoom = function(id) {
        var room = self.rooms.get(id);
        self.rooms.remove(room);
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
        }, function(messages) {
            console.log(messages);
        });
    }
    this.addMessage = function(data) {
        console.log(data);
        var add = function(message) {
            var room = self.rooms.get(message.room);
            room.messages.add(message);
        }
        if ($.isArray(data)) {
            _.each(data, add); 
        } else {
            add(data);
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
        self.socket.on('messages:new', function(message) {
            self.addMessage(message);
        });
    }
    
    //
    // Router
    //
    this.route = function() {
        var Router = Backbone.Router.extend({
            routes: {
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
        this.notifications.on('newmessage', function(message) {
            self.sendMessage(message);
        });
        this.notifications.on('tabclosed', function(data) {
            self.leaveRoom(data.id);
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