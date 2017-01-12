//
// User
//

'use strict';

var bcrypt = require('bcryptjs'),
    crypto = require('crypto'),
    md5 = require('md5'),
    hash = require('node_hash'),
    mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator'),
    validate = require('mongoose-validate'),
    settings = require('./../config');

var ObjectId = mongoose.Schema.Types.ObjectId;

var UserSchema = new mongoose.Schema({
    provider: {
        type: String,
        required: true,
        trim: true
    },
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
        match: new RegExp(settings.auth.local.passwordRegex),
        set: function(value) {
            // User can only change their password if it's a local account
            if (this.local) {
                return value;
            }
            return this.password;
        }
    },
    token: {
        type: String,
        required: false,
        trim: true
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
        lowercase: true,
        unique: true,
        match: /^[\w][\w\-\.]*[\w]$/i
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
    openRooms: [{
      		type: String,
                trim: true
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
    return this.provider === 'local';
});

UserSchema.virtual('avatar').get(function() {
    if (!this.email) {
      return null;
    }
    return md5(this.email);
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

UserSchema.statics.findByIdentifier = function(identifier, cb) {
    var opts = {};

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        opts.$or = [{_id: identifier}, {username: identifier}];
    } else if (identifier.indexOf('@') === -1) {
        opts.username = identifier;
    } else {
        opts.email = identifier;
    }

    this.findOne(opts, cb);
};

UserSchema.methods.generateToken = function(cb) {
    if (!this._id) {
        return cb('User needs to be saved.');
    }

    crypto.randomBytes(24, function(ex, buf) {
        var password = buf.toString('hex');

        bcrypt.hash(password, 10, function(err, hash) {
            if (err) {
                return cb(err);
            }

            this.token = hash;

            var userToken = new Buffer(
                this._id.toString() + ':' + password
            ).toString('base64');

            cb(null, userToken);

        }.bind(this));
    }.bind(this));
};

UserSchema.statics.findByToken = function(token, cb) {

    if (!token) {
        return cb(null, null);
    }

    var tokenParts = new Buffer(token, 'base64').toString('ascii').split(':'),
        userId = tokenParts[0],
        hash = tokenParts[1];

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        cb(null, null);
    }

    this.findById(userId, function(err, user) {
        if (err) {
            return cb(err);
        }

        if (!user) {
            return cb(null, null);
        }

        bcrypt.compare(hash, user.token, function(err, isMatch) {
            if (err) {
                return cb(err);
            }

            if (isMatch) {
                return cb(null, user);
            }

            cb(null, null);
        });
    });
};

UserSchema.methods.comparePassword = function(password, cb) {

    var local = settings.auth.local,
        salt = local && local.salt;

    // Legacy password hashes
    if (salt && (hash.sha256(password, salt) === this.password)) {
        return cb(null, true);
    }

    // Current password hashes
    bcrypt.compare(password, this.password, function(err, isMatch) {

        if (err) {
            return cb(err);
        }

        if (isMatch) {
            return cb(null, true);
        }

        cb(null, false);

    });

};

UserSchema.statics.authenticate = function(identifier, password, cb) {
    this.findByIdentifier(identifier, function(err, user) {
        if (err) {
            return cb(err);
        }
        // Does the user exist?
        if (!user) {
            return cb(null, null, 0);
        }
        // Is this a local user?
        if (user.provider !== 'local') {
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
        lastName: this.lastName,
        username: this.username,
        displayName: this.displayName,
        avatar: this.avatar,
        openRooms: this.openRooms,
    };
});

module.exports = mongoose.model('User', UserSchema);
