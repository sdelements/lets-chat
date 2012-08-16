var UserModel = Backbone.Model.extend({
});

var UsersCollection = Backbone.Collection.extend({
    model: UserModel
});

var MessageModel = Backbone.Model.extend({
});

var MessagesCollection = Backbone.Collection.extend({
    model: MessageModel
});

var RoomModel = Backbone.Model.extend({
    initialize: function() {
        this.messages = new MessagesCollection();
        this.users = new UsersCollection();
    }
});

var RoomsCollection = Backbone.Collection.extend({
    model: RoomModel
});