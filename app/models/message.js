//
// Message
//

'use strict';

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId;

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
        required: true,
        trim: true
    },
    posted: {
        type: Date,
        default: Date.now
    }
});

// EXPOSE ONLY CERTAIN FIELDS
// This helps ensure that the client gets
// data that can be digested properly
MessageSchema.method('toJSON', function() {
    return {
        id: this._id,
        room: this.room,
        owner: this.owner,
        text: this.text,
        posted: this.posted
    };
});

module.exports = mongoose.model('Message', MessageSchema);
