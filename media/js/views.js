//
// LCB Views
//

//
// Rooms List
//

var RoomsBrowserView = Backbone.View.extend({
    initialize: function(options) {
        this.template = Handlebars.compile($('#template-room-browser-item').html());
        this.rooms = options.rooms;
        this.rooms.on('add', function(room) {
            this.$el.append(this.template(room.toJSON()));
        }, this);
    }
});


//
// Rooms
//

var RoomsView = Backbone.View.extend({
    initialize: function(options) {
        this.template = Handlebars.compile($('#template-room').html());
        this.rooms = options.rooms;
        this.rooms.on('change', function(room) {
            console.log(room);
            if (room.get('joined')) {
                this.$el.append(this.template(room.toJSON()));
                console.log(room.toJSON());
            }
        }, this);
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
        this.rooms = new RoomsView({
            el: this.$el.find('.lcb-rooms'),
            rooms: this.client.rooms
        });
    }
});