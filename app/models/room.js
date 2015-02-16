//
// Room
//

'use strict';

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    uniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcryptjs'),
    settings = require('./../config');

var RoomSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        match: /^[a-z0-9_]+$/i
    },
    archived: {
        type: Boolean,
        default: false
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
    },
    password: {
        type: String,
        required: false//only for passworded room
    }
});

RoomSchema.virtual('handle').get(function() {
    return this.slug || this.name.replace(/\W/i, '');
});

RoomSchema.pre('save', function(next) {
    var room = this;
    if (!room.password || !room.isModified('password')) {
        return next();
    }

    bcrypt.hash(room.password, 10, function(err, hash) {
        if (err) {
            return next(err);
        }
        room.password = hash;
        next();
    });
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
        owner: room.owner,
        hasPassword: !!this.password
        //password : never send password to client !
    };
 });

RoomSchema.statics.findByIdOrSlug = function(identifier, cb) {
    var opts = {
        archived: { $ne: true }
    };

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        opts.$or = [{_id: identifier}, {slug: identifier}];
    } else {
        opts.slug = identifier;
    }

    this.findOne(opts, cb);
};

module.exports = mongoose.model('Room', RoomSchema);
