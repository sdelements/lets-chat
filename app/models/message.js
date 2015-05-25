//
// Message
//

'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var MessageSchema = new mongoose.Schema({
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
    text: {
        type: String,
        required: true
    },
    posted: {
        type: Date,
        default: Date.now,
        index: true
    }
});

MessageSchema.index({ text: 'text', room: 1, posted: -1, _id: 1 });

// EXPOSE ONLY CERTAIN FIELDS
// This helps ensure that the client gets
// data that can be digested properly
MessageSchema.method('toJSON', function() {
    return {
        id: this._id,
        room: this.room,
        text: this.text,
        posted: this.posted,

        // if populate('owner') and user's been deleted - owner will be null
        // otherwise it will be an id or undefined
        owner: this.owner || {
            displayName: '[Deleted User]',
            username: '_deleted_user_'
        }
    };
});

module.exports = mongoose.model('Message', MessageSchema);
