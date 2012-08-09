var Client = function(config) {

    var self = this;
    
    //
    // DOM Elements
    //
    this.dom = {
        $templates: $('#js-templates')
    }
    
    //
    // Templates
    //
    this.templates = function(id) {
        var $template = self.dom.$templates.find('#js-tmpl-' + id);
        return $template.html()
    }
    
    //
    // Room Collection
    //
    this.rooms = new RoomsCollection();
    
    //
    // Client View
    //
    this.view = new ClientView({
        templates: this.templates,
        rooms: this.rooms
    });
    
    //
    // Room actions
    //
    this.joinRoom = function(id, switchRoom) {
        self.socket.emit('room:join', id, function(room) {
            self.rooms.add(room);
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
    
    //
    // Connection
    //
    this.listen = function() {
        self.socket = io.connect(config.host, {
            reconnect: true,
            transports: config.transports
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
        self.view.tabs.on('tabclosed', function(data) {
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