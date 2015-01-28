'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    core = require('./../core/files');

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

FileSchema.method('toJSON', function() {
    return {
        id: this._id,
        room: this.room,
        owner: this.owner,
        name: this.name,
        type: this.type,
        size: this.size,
        url: core.getUrl(this)
    };
});

module.exports = mongoose.model('File', FileSchema);
