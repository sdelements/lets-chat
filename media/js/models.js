//
// LCB Models
//

var Tab = Backbone.Model.extend({
    defaults: {
        id: 'list',
        type: 'list',
        model: null
    }

});

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
        this.current = new Backbone.Model();
        this.last = new Backbone.Model();
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
