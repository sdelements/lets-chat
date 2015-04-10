//
// LCB Models
//

var Tab = Backbone.Model.extend({
    defaults: {
        id: 'list',
        type: 'list',
        name: 'Rooms',
        model: null
    },

    initialize: function() {
        var type = this.get('type');

        if (type === 'room') {
            var room = this.get('model');
            this.set('name', room.get('name'));
            room.on('change:name', function(name) {
                this.set('name', name);
            }, this);
        }
    }

});

Tab.roomList = function(room) {
    return new Tab();
};

Tab.room = function(room) {
    return new Tab({
        id: room.id,
        type: 'room',
        model: room
    });
};

var TabCollection = Backbone.Collection.extend({
    model: Tab,
    initialize: function() {
        this.on('remove', function(model) {
            if (model.get('selected')) {
                model.set('selected', false);
                this.get('list').set('selected', true);
            }
        }, this);
    },

    selectTab: function(id) {
        var tab = this.get(id);
        if (tab) {
            this.forEach(function(x) {
                x.set('selected', false);
            });
            tab.set('selected', true);
        }
    }
});

var UserModel = Backbone.Model.extend();

var UsersCollection = Backbone.Collection.extend({
    model: UserModel
});

var MessageModel = Backbone.Model.extend();

var MessagesCollection = Backbone.Collection.extend({
    model: MessageModel
});

var FileModel = Backbone.Model.extend();

var FilesCollection = Backbone.Collection.extend({
    model: FileModel
});

var RoomModel = Backbone.Model.extend({
    defaults: {
        lastMessageOwner: null,
        lastMessagePosted: null
    },

    initialize: function() {
        this.messages = new MessagesCollection();
        this.users = new UsersCollection();
        this.files = new FilesCollection();
        this.lastMessage = new Backbone.Model();
        //
        // Child events
        //
        this.users.on('add', _.bind(function(user) {
            this.trigger('users:add', user, this);
        }, this));
        this.users.on('remove', function(user) {
            this.trigger('users:remove', user, this);
        }, this);
    },
    loaded: false
});

var RoomsCollection = Backbone.Collection.extend({
    model: RoomModel,
    initialize: function() {
        this.on('users:add users:remove', this.sort);
    },
    comparator: function(a, b) {
        var au = a.users.length,
            bu = b.users.length,
            aj = a.get('joined'),
            bj = b.get('joined');

        if (aj && bj || !aj && !bj) {
            if (au > bu) {
                return -1;
            }
            if (au < bu) {
                return 1;
            }
        }

        if (aj) {
            return -1;
        }

        if (bj) {
            return 1;
        }
        return 0;
    }
});
