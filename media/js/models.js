//
// LCB Models
//

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
    }
});
