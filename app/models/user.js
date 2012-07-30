var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var check = require('validator').check;

var UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate: [function(v) {
            try {
                check(v).isEmail();
            } catch (e) {
                return false;
            }
            return true;
        }, 'invalid email']
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate: [function(v) {
            return (v.length >= 4);
        }, 'invalid email']
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        validate: [function(v) {
            return (v.length <= 24);
        }, 'invalid first name']
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        validate: [function(v) {
            return (v.length <= 24);
        }, 'invalid last name']
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
	messages: [{
		type: Schema.ObjectId,
		ref: 'Message' 
	}]
});

module.exports = mongoose.model('User', UserSchema);
