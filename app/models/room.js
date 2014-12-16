//
// Room
//

'use strict';

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    uniqueValidator = require('mongoose-unique-validator'),
    settings = require('./../config');

var RoomSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        match: /^[a-zA-Z0-9_]+$/i
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    owner: {
		type: ObjectId,
		ref: 'User',
        required: true
    },
	messages: [{
		type: ObjectId,
		ref: 'Message'
	}],
    created: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

RoomSchema.virtual('handle').get(function() {
    return this.slug || this.name.replace(/\W/i, '');
});

RoomSchema.plugin(uniqueValidator, {
    message: 'Expected {PATH} to be unique'
});

RoomSchema.method('toJSON', function() {
    var room = this.toObject();
    return {
        id: room._id,
        slug: room.slug,
        name: room.name,
        description: room.description,
        lastActive: room.lastActive,
        created: room.created,
        owner: room.owner
    };
 });

module.exports = mongoose.model('Room', RoomSchema);
