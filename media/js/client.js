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

        self.listen();
        
        return self;
        
    };

    // Go
    return this;

};