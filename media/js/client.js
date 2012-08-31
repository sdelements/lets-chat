var Client = function(config) {

    var self = this;
    
    //
    // State
    //
    this.state = {
        user: '',
        currentRoom: '',
        rooms: config.rooms
    }
    
    //
    // Rooms Collection
    //
    this.rooms = new RoomsCollection();
    
    //
    // Routing
    //
    this.setupRoutes = function() {
        var Router = Backbone.Router.extend({
            routes: {
                '!/room/:id': 'switchRoom',
                '*path': 'showRoomList'
            },
            showRoomList: function() {
                self.view.switchRoom();
            },
            switchRoom: function(id) {
                self.joinRoom(id, true);
            }
        });
        self.router = new Router;
        Backbone.history.start();
    };
    
    //
    // Listen
    //
    this.listen = function() {
        self.socket = io.connect(config.host, {
            reconnect: true,
            transports: config.transports
        });
        self.socket.on('room:newuser', function(data) {
            var room = self.rooms.get(data.room);
            room.set('users', data.users);
        });
        self.socket.on('room:removeuser', function(data) {
            var room = self.rooms.get(data.room);
            room.set('users', data.users);
        });
        /** self.socket.on('room:meta', function(room) {
            var model = self.rooms.get(room._id);
            console.log(room);
            model.set({
                name: room.name,
                description: room.description
            });
        }); **/
    };

    //
    // Room Stuffs
    //
    this.joinRoom = function(id, switchRoom) {
        self.socket.emit('room:join', id, function(room) {
            if (!self.rooms.get(id)) {
                self.rooms.add(room);
            }
            if (switchRoom) {
                self.switchRoom(id);
            }
        });
    };
    this.leaveRoom = function(id) {
        self.rooms.remove(id);
        self.socket.emit('room:leave', id);
    };
    this.switchRoom = function(id) {
        if (self.rooms.get(id)) {
            self.view.switchRoom(id);
        }
    };

    //
    // GUI
    //
    this.view = new ClientView(this);

    this.start = function() {
        this.listen();
        this.setupRoutes();
        return this;
    };

}

/***
var Client = function(config) {

    var self = this;

    this.RoomModel = {
        id: '',
        name: '',
        description: '',
        messages: [],
        view: new RoomView()
    };

    this.rooms = {
        add: function(room) {
            if (!self.rooms[room.id]) {
                self.rooms[room.id] = room;
            }
        },
        remove: function(id) {
            delete self.rooms[room.id]
        },
        rooms: {}
    }

    this.join = function(id) {
        console.log('joined room');
        this.rooms.add(id);
    };

    this.switchRoom = function(id) {
        console.log('switched room');
        this.state.room = id;
    };

    this.start = function() {
        console.log('started');
        return this;
    };

};
***/

// -------------

/******

var Client = function(config) {

    var self = this;

    this.config = config;

    this.state = {
        user: {},
        room: self.config.room,
        lastPing: 0
    }

    this.gui = new ClientGUI(this);

    this.room = {
        messages: {
            add: function(message) {
                self.socket.emit('messages:add',  {
                    room: self.state.room,
                    text: $.trim(message)
                });
            }
        }
    }
    
    this.switchRoom = function(id) {
        
    }

    this.setupRoutes = function() {
        var Router = Backbone.Router.extend({
            routes: {
                '!/': 'showRoomList',
                '!/room/:id': 'switchRoom'
            },
            showRoomList: function() {
                self.switchRoom();
                console.log('ROOMS LIST');
            },
            switchRoom: function(id) {
                self.switchRoom(id);
                console.log(id)
            }
        });
        self.router = new Router;
        Backbone.history.start();
    };

    this.listen = function() {

        var config = self.config;
        
        self.socket = io.connect(config.host, {
            reconnect: true,
            transports: config.transports
        });
        
        self.pingTimer = setInterval(function () {
            var d = new Date();
            self.state.lastPing = d.getTime();
            self.socket.emit('ping', {});
        }, 1000);
        
        self.socket.on('connect', function () {
        
            self.socket.emit('room:join', self.state.room);
            self.socket.emit('room:users', self.state.room);
            self.socket.emit('room:history', self.state.room);
            self.socket.emit('session:get');
            
            self.gui.info.updateStatus('Connected');
            
        });

        self.socket.on('ping', function () {
            var d = new Date();
            var ping = (d - self.state.lastPing);
            self.gui.info.updatePing(ping);
        });

        self.socket.on('session:user', function(user) {
            self.state.user = user;
        });

        self.socket.on('messages:new', function(message) {
            self.gui.messages.add(message);
        });

        self.socket.on('room:users', function(users) {
            self.gui.userlist.init(users);
        });
        
        self.socket.on('user:join', function(user) {
            self.gui.userlist.add(user);
        });
        
        self.socket.on('user:disconnect', function(user) {
            self.gui.userlist.remove(user.cid);
        });
        
        self.socket.on('messages:history', function(messages) {
            self.gui.messages.init(messages);
        });
        
        self.socket.on('disconnect', function() {
            self.gui.info.updateStatus('Disconnected');
        });

    }

    this.start = function() {
        self.setupRoutes();
        self.listen();
        return self;
    };

    // Go
    return this;

};

***/