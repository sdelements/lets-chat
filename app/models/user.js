//
// User
//

'use strict';

var bcrypt = require('bcryptjs'),
    md5 = require('MD5'),
    hash = require('node_hash'),
    settings = require('./../config');

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    uniqueValidator = require('mongoose-unique-validator'),
    validate = require('mongoose-validate'),
    settings = require('./../config');

var UserSchema = new mongoose.Schema({
    uid: {
        type: String,
        required: false,
        trim: true,
        validate: [function(v) {
            return (v.length <= 24);
        }, 'invalid ldap/kerberos username']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate: [ validate.email, 'invalid email address' ]
    },
    password: {
        type: String,
        required: false, // Only required if local
        trim: true,
        match: /^.{8,64}$/i,
        set: function(value) {
            // User can only change their password if it's a local account
            if (this.local) {
                return value;
            }
            return this.password;
        }
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        match: /^[a-zA-Z0-9_]+$/i,
        set: function(value) {
            // User can only change their username if it's a local account
            if (this.local) {
                return value;
            }
            return this.username || this.uid;
        }
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    joined: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        trim: true
    },
    rooms: [{
		type: ObjectId,
		ref: 'Room'
    }],
	messages: [{
		type: ObjectId,
		ref: 'Message'
	}]
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

UserSchema.virtual('local').get(function() {
    return typeof this.uid !== 'string';
});

UserSchema.virtual('screenName').get(function() {
    return this.username || this.uid || this.displayName.replace(/\W/i, '');
});

UserSchema.virtual('avatar').get(function() {
    return md5(this.email);
});

UserSchema.post('init', function (doc) {
    if (!this.username) {
        if (this.uid) {
            this.username = this.uid;
        }
    }
});

UserSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }

    bcrypt.hash(user.password, 10, function(err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (isMatch) {
            return cb(null, true);
        }

        var legacyPassowrd = hash.sha256(password,
                                         settings.auth.local.salt);
        cb(null, legacyPassowrd === this.password);

    }.bind(this));
};

UserSchema.statics.authenticate = function(identifier, password, cb) {
    var options = {};

    if (identifier.indexOf('@') === -1) {
        options.username = identifier;
    } else {
        options.email = identifier;
    }

    this.findOne(options, function(err, user) {
        if (err) {
            return cb(err);
        }
        // Does the user exist?
        if (!user) {
            return cb(null, null, 0);
        }
        // Is password okay?
        user.comparePassword(password, function(err, isMatch) {
            if (err) {
                return cb(err);
            }
            if (isMatch) {
                return cb(null, user);
            }
            // Bad password
            return cb(null, null, 1);
        });
    });
};

UserSchema.plugin(uniqueValidator, {
    message: 'Expected {PATH} to be unique'
});

// EXPOSE ONLY CERTAIN FIELDS
// It's really important that we keep
// stuff like password private!
UserSchema.method('toJSON', function() {
    return {
        id: this._id,
        firstName: this.firstName,
        lastname: this.lastName,
        screenName: this.screenName,
        displayName: this.displayName,
        avatar: this.avatar,
        email: this.email,
        username: this.username,
        local: this.local
    };
});

module.exports = mongoose.model('User', UserSchema);
