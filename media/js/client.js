//
// LCB Client
//

(function(window, $, _) {
    //
    // Base
    //
    var Client = function(config) {
        this.config = config;
        this.status = new Backbone.Model();
        this.user = new UserModel();
        this.users = new UsersCollection();
        this.rooms = new RoomsCollection();
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
    Client.prototype.updateProfile = function(profile) {
        var that = this;
        this.socket.emit('account:profile', profile, function(user) {
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
            slug: data.slug,
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
    Client.prototype.getRooms = function() {
        var that = this;
        this.socket.emit('rooms:list', { userCounts: true }, function(rooms) {
            that.rooms.set(rooms);
            // Get users for each room!
            // We do it here for the room browser
            _.each(rooms, function(room) {
                if (room.userCount) {
                    that.getRoomUsers(room.id, _.bind(that.setUsers, that));
                }
            });
        });
    };
    Client.prototype.switchRoom = function(id) {
        // Make sure we have a last known room ID
        this.rooms.last.set('id', this.rooms.current.get('id'));
        if (!id || id == 'list') {
            this.rooms.current.set('id', 'list');
            this.router.navigate('!/', {
                replace: true
            });
            return;
        }
        var room = this.rooms.get(id);
        if (room && room.get('joined')) {
            this.rooms.current.set('id', id);
            this.router.navigate('!/room/' + room.id, {
                replace: true
            });
            return;
        } else {
            this.joinRoom(id, true);
        }
    };
    Client.prototype.updateRoom = function(room) {
        this.socket.emit('rooms:update', room);
    };
    Client.prototype.roomUpdate = function(resRoom) {
        var room = this.rooms.get(resRoom.id);
        if (!room) {
            // Nothing to do
            return;
        }
        room.set(resRoom);
    };
    Client.prototype.addRoom = function(room) {
        this.rooms.add(room);
    };
    Client.prototype.archiveRoom = function(id) {
        this.socket.emit('rooms:archive', id, function(room) {
            if (!room.id) {
                swal('Unable to Archive!', 'Unable to archive this room!', 'error');
            }
        });
    }
    Client.prototype.roomArchive = function(room) {
        this.leaveRoom(room.id);
        this.rooms.remove(room.id);
    };
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
            // Room was likely archived if this returns
            if (!resRoom) {
                return;
            }
            var room = that.rooms.get(id);
            room = that.rooms.add(resRoom);
            room.set('joined', true);
            // Get room history
            that.getMessages({
                room: room.id,
                limit: 200,
                from: room.lastMessage.get('id')
            }, function(messages) {
                that.addMessages(messages, !room.get('loaded'));
                room.set('loaded', true);
            });
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
    };
    Client.prototype.leaveRoom = function(id) {
        var room = this.rooms.get(id);
        if (room) {
            room.set('joined', false);
        }
        this.socket.emit('rooms:leave', id);
        if (id === this.rooms.current.get('id')) {
            var room = this.rooms.get(this.rooms.last.get('id'));
            this.switchRoom(room && room.get('joined') ? room.id : '');
        }
        // Remove room id from localstorage
        store.set('openrooms', _.without(store.get('openrooms'), id));
    };
    Client.prototype.getRoomUsers = function(id, callback) {
        this.socket.emit('rooms:users', {
            room: id
        }, callback);
    };
    //
    // Messages
    //
    Client.prototype.addMessage = function(message) {
        var room = this.rooms.get(message.room.id || message.room);
        if (!room || !message) {
            // Unknown room, nothing to do!
            return;
        }
        room.set('lastActive', message.posted)
        room.lastMessage.set(message);
        room.trigger('messages:new', message);
    };
    Client.prototype.addMessages = function(messages, historical) {
        _.each(messages, function(message) {
            if (historical) {
                message.historical = true;
            }
            this.addMessage(message);
        }, this);
    };
    Client.prototype.sendMessage = function(message) {
        this.socket.emit('messages:create', message);
    };
    Client.prototype.getMessages = function(query, callback) {
        this.socket.emit('messages:list', query, callback);
    };
    //
    // Users
    //
    Client.prototype.setUsers = function(users) {
        if (!users || !users[0] ||!users[0].room) {
            // Data is not valid
            return;
        }
        var room = this.rooms.get(users[0].room);
        if (!room) {
            // No room
            return;
        }
        room.users.set(users);
    };
    Client.prototype.addUser = function(user) {
        var room = this.rooms.get(user.room);
        if (!room) {
            // No room
            return;
        }
        room.users.add(user);
    };
    Client.prototype.removeUser = function(user) {
        var room = this.rooms.get(user.room);
        if (!room) {
            // No room
            return;
        }
        room.users.remove(user.id);
    };
    Client.prototype.updateUser = function(user) {
        // Update if current user
        if (user.id == this.user.id) {
            this.user.set(user);
        }
        // Update all rooms
        this.rooms.each(function(room) {
            var target = room.users.findWhere({
                id: user.id
            });
            target && target.set(user);
        }, this);
    }
    Client.prototype.getUsers = function(id, callback) {
        var that = this;
        this.socket.emit('users:list', function(users) {
            that.users.set(users);
            if (callback) {
                callback(users);
            }
        });
    };
    //
    // Extras
    //
    Client.prototype.getEmotes = function(callback) {
        this.socket.emit('extras:emotes:list', _.bind(function(emotes) {
            this.extras = this.extras || {};
            this.extras.emotes = emotes;
            if (callback) {
                callback(emotes);
            }
        }, this));
    };
    Client.prototype.getReplacements = function(callback) {
        this.socket.emit('extras:replacements:list', _.bind(function(replacements) {
            this.extras = this.extras || {};
            this.extras.replacements = replacements;
            if (callback) {
                callback(replacements);
            }
        }, this));
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
        this.router = new Router();
        Backbone.history.start();
    };
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
            that.getEmotes();
            that.getReplacements();
            that.getUser();
            that.getUsers();
            that.getRooms();
            that.status.set('connected', true);
        });
        this.socket.on('reconnect', function() {
            that.getEmotes();
            that.getReplacements();
            _.each(that.rooms.where({ joined: true }), function(room) {
                that.joinRoom(room.id);
            });
        });
        this.socket.on('messages:new', function(message) {
            that.addMessage(message);
        });
        this.socket.on('rooms:new', function(data) {
            that.addRoom(data);
        });
        this.socket.on('rooms:update', function(room) {
            that.roomUpdate(room);
        });
        this.socket.on('rooms:archive', function(room) {
            that.roomArchive(room);
        });
        this.socket.on('users:join', function(user) {
            that.addUser(user);
        });
        this.socket.on('users:leave', function(user) {
            that.removeUser(user);
        });
        this.socket.on('users:update', function(user) {
            that.updateUser(user);
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
        this.events.on('rooms:archive', this.archiveRoom, this);
        this.events.on('profile:update', this.updateProfile, this);
    };
    //
    // Start
    //
    Client.prototype.start = function() {
        this.listen();
        this.route();
        this.view = new window.LCB.ClientView({
            client: this
        });
        //
        // Join rooms from localstorage
        //
        var openRooms = store.get('openrooms');
        if (openRooms instanceof Array) {
            // Flush the stored array
            store.set('openrooms', []);
            // Let's open some rooms!
            _.each(_.uniq(openRooms), function(id) {
                this.joinRoom(id);
            }, this);
        }
        return this;
    };
    //
    // Add to window
    //
    window.LCB = window.LCB || {};
    window.LCB.Client = Client;
})(window, $, _);
