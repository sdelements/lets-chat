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
            this.$el.find('.lcb-rooms-list').append(this.template(room.toJSON()));
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
            if (room.get('joined')) {
                this.$el.append(this.template(room.toJSON()));
            }
        }, this);
        this.rooms.current.on('change:id', function(current, id) {
            this.$el.find('[data-id=' + id + ']').show()
                .siblings().hide();
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