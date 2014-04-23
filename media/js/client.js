//
// LCB Client
//

+function(window, $, _) {
    //
    // Base
    //
    var Client = function(config) {
        this.config = config;
        this.user = new UserModel();
        this.rooms = new RoomsCollection();
        return this;
    };
    //
    // Room Actions
    //
    Client.prototype.switchRoom = function(id) {
        var room = this.rooms.get(id);
        console.log(id);
    }
    //
    // Router
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
                that.switchRoom(id)
            },
            list: function() {
                that.switchRoom();
            }
        });
        that.router = new Router;
        Backbone.history.start();
    }
    //
    // Start
    //
    Client.prototype.start = function() {
        this.route();
        console.log('go!');
    };
    //
    // Add to window
    //
    window.LCB = window.LCB || {};
    window.LCB.Client = Client;
}(window, $, _);