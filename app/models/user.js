//
// User
//

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    uniqueValidator = require('mongoose-unique-validator'),
    validate = require('mongoose-validate'),
    bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
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
        required: true,
        trim: true,
        match: /^.{8,64}$/i
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
});

UserSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password'))
        return next();
    bcrypt.genSalt(10, function(err, salt) {
        if (err)
            return next(err);
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err)
                return next(err);
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err)
            return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.statics.authenticate = function(email, password, cb) {
    this.findOne({
        email: email
    }, function(err, user) {
        if (err) return cb(err);
        // Does the user exist?
        if (!user) {
            return cb(null, null, 0);
        }
        // Is password okay?
        user.comparePassword(password, function(err, isMatch) {
            if (err)
                return cb(err);
            if (isMatch) {
                return cb(null, user);
            }
            // Bad password bro
            return cb(null, null, 1);
        });
    });
};

UserSchema.plugin(uniqueValidator, {
    message: 'Expected {PATH} to be unique'
});

module.exports = mongoose.model('User', UserSchema);
