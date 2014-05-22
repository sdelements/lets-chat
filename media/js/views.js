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
        this.views = {};
        this.rooms.on('change', function(room) {
            // Joined room?
            if (room.get('joined')) {
                this.add(room);
            }
        }, this);
        // Switch room
        this.rooms.current.on('change:id', function(current, id) {
            this.switch(id);
        }, this);
    },
    switch: function(id) {
        this.$el.find('[data-id=' + id + ']').show()
            .siblings().hide();
    },
    add: function(room) {
        if (this.views[room.id]) {
            // Nothing to do, this room is here
            return;
        }
        this.views[room.id] = new RoomView({
            template: this.template,
            model: room
        });
        this.$el.append(this.views[room.id].$el);
    }
});

//
// Room
//
var RoomView = Backbone.View.extend({
    events: {
        
    },
    initialize: function(options) {
        this.template = options.template;
        this.render();
        return this;
    },
    render: function() {
        this.$el = $(this.template(this.model.toJSON()))
        return this;
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