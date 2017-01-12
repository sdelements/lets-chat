//
// Message
//

'use strict';

var mongoose = require('mongoose'),
    settings = require('./../config');

var ObjectId = mongoose.Schema.Types.ObjectId;

var MessageSchema = new mongoose.Schema({
    users: [{
        type: ObjectId,
        ref: 'User'
    }],
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
        default: Date.now
    }
});

if (settings.private.expire !== false) {
    var defaultExpire = 6 * 60; // 6 hours

    MessageSchema.index({ posted: 1 }, {
        expireAfterSeconds: (settings.private.expire || defaultExpire) * 60
    });
}

MessageSchema.index({ users: 1, posted: -1, _id: 1 });

// EXPOSE ONLY CERTAIN FIELDS
// This helps ensure that the client gets
// data that can be digested properly
MessageSchema.method('toJSON', function() {
    return {
        id: this._id,
        owner: this.owner,
        text: this.text,
        posted: this.posted
    };
});

module.exports = mongoose.model('UserMessage', MessageSchema);
