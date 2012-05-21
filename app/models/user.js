var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var UserSchema = new Schema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    displayName: String,
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
