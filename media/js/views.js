//
// LCB Views
//

//
// Rooms List
//
var RoomsBrowserView = Backbone.View.extend({
    initialize: function(options) {
        this.rooms = options.rooms;
        this.binding = rivets.bind(this.el, {
            list: new Backbone.Model({
                rooms: this.rooms
            })
        });
    }
});

//
// Client
//
var ClientView = Backbone.View.extend({
    el: '#lcb-client',
    initialize: function(options) {
        this.client = options.client;
        //
        // Subviews
        //
        this.roomsBrowser = new RoomsBrowserView({
            el: this.$el.find('.lcb-rooms-browser'),
            rooms: this.client.rooms
        });
    }
});