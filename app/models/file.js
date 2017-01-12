'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var FileSchema = new Schema({
    room: {
        type: ObjectId,
        ref: 'Room',
        required: true
    },
    owner: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploaded: {
        type: Date,
        default: Date.now
    }
});

FileSchema.virtual('url').get(function() {
    return 'files/' + this._id + '/' + encodeURIComponent(this.name);
});

FileSchema.method('toJSON', function(user) {
    var data = {
        id: this._id,
        owner: this.owner,
        name: this.name,
        type: this.type,
        size: Math.floor(this.size / 1024) + 'kb',
        url: this.url,
        uploaded: this.uploaded
    };

    if (this.room._id) {
        data.room = this.room.toJSON(user);
    } else {
        data.room = this.room;
    }

    return data;
});

module.exports = mongoose.model('File', FileSchema);
