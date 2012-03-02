var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var userSchema = new Schema({
    username: String,
    firstName: String,
    lastName: String,
    DisplayName: String,
    joined: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
