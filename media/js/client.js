var Client = function(config) {

    var self = this;

    this.config = config;

    this.state = {
        user: {}, // TODO: Add something here
        room: self.config.room
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

    this.listen = function() {

        var config = self.config;

        self.socket = io.connect(config.host, {
            reconnect: true,
            transports: config.transports
        });
        
        self.socket.on('connect', function () {
            self.socket.emit('rooms:join', self.state.room);
            self.socket.emit('session:get');
        });

        self.socket.on('session:user', function(user) {
            self.state.user = user;
        });

        self.socket.on('messages:new', function(message) {
            console.log(message);
            self.gui.messages.add(message);
        });

        self.socket.on('room:history', function(messages) {
            self.gui.messages.init(messages);
        });

    }

    this.start = function() {
        self.listen();
        return self;
    };

    // Go
    return this;

};