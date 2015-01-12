//
// User
//

'use strict';

var bcrypt = require('bcryptjs'),
    md5 = require('MD5'),
    hash = require('node_hash'),
    settings = require('./../config'),
    NO_DELAY_AUTH_ATTEMPTS = 3,
    MAX_AUTH_DELAY_TIME = 24 * 60 * 60 * 1000;

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
    authAttempts: {
        type: Number,
        required: true,
        default: 0
    },
    lockedUntil: {
        type: Number
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

UserSchema.virtual('isLocked').get(function() {
    return (this.lockedUntil && this.lockedUntil > Date.now());
});

UserSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (isMatch) {
            return cb(null, true);
        }

        var legacyPassword = hash.sha256(password,
                                         settings.auth.local.salt);
        cb(null, legacyPassword === this.password);

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
        // Is the user locked out?
        if (user.isLocked) {
            return cb(null, null, 'Account locked.');
        }

        // Is password okay?
        user.comparePassword(password, function(err, isMatch) {
            if (err) {
                return cb(err);
            }
            if (isMatch) {
                // if there's no lock or failed attempts, just return the user
                if (!user.authAttempts && !user.lockedUntil) return cb(null, user);

                // Reset auth lockout details
                var updates = {
                    $set: { authAttempts: 0 },
                    $unset: { lockedUntil: 1 }
                };
                return user.update(updates, function(err) {
                    if (err) return cb(err);
                    return cb(null, user);
                });
            }
            // Increment login attemp
            user.incAuthAttempts(function(err) {
                if (err) return cb(err);
                return cb(null, null, 'Incorrect login credentials.');
            });
        });
    });
};

UserSchema.methods.incAuthAttempts = function(cb) {
    // Has the lock expired?
    if (this.lockedUntil && this.lockedUntil < Date.now()) {
        return this.update({
            $unset: { lockedUntil: 1 }
        }, cb);
    }
    // Increment auth attempt
    var updates = { $inc: { authAttempts: 1 } };

    // Lock the account if too many attempts are made
    if (this.authAttempts + 1 >= NO_DELAY_AUTH_ATTEMPTS && !this.isLocked) {
        var lock = Math.min(5000 * Math.pow(2,(this.authAttempts - NO_DELAY_AUTH_ATTEMPTS), MAX_AUTH_DELAY_TIME));
        updates.$set = { lockedUntil: Date.now() + lock };
    }
    return this.update(updates, cb);
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
