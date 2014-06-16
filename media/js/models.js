//
// LCB Models
//

var UserModel = Backbone.Model.extend({
    get: function (attr) {
        if (typeof this[attr] === 'function') return this[attr]();
        return Backbone.Model.prototype.get.call(this, attr);
    },
    safeName: function() {
        return this.get('displayName') && this.get('displayName').replace(/\W/i, '');
    }
});

var UsersCollection = Backbone.Collection.extend({
    model: UserModel
});

var MessageModel = Backbone.Model.extend({
});

var MessagesCollection = Backbone.Collection.extend({
    model: MessageModel
});

var FileModel = Backbone.Model.extend({
});

var FilesCollection = Backbone.Collection.extend({
    model: FileModel
});

var RoomModel = Backbone.Model.extend({
    initialize: function() {
        this.messages = new MessagesCollection();
        this.users = new UsersCollection();
        this.files = new FilesCollection();
        this.lastMessage = new Backbone.Model;
    }
});

var RoomsCollection = Backbone.Collection.extend({
    model: RoomModel,
    initialize: function() {
        this.current = new Backbone.Model;
        this.last = new Backbone.Model;
    }
});