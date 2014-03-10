//
// User
//

var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.Types.ObjectId,
    uniqueValidator = require('mongoose-unique-validator');
    
var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
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

UserSchema.plugin(uniqueValidator, {
    message: 'Expected {PATH} to be unique'
});

module.exports = mongoose.model('User', UserSchema);