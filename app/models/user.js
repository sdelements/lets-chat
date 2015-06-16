//
// User
//

'use strict';

var bcrypt = require('bcryptjs'),
    crypto = require('crypto'),
    md5 = require('MD5'),
    hash = require('node_hash'),
    mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator'),
    validate = require('mongoose-validate'),
    settings = require('./../config'),
    test = 'this is a test for encrytion';

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
	
	var start = new Date().getTime();
	
	/* Diffie Hellman */
	var prime_length = 1536; 
	/*  OTR uses a combination of AES symmetric-key algorithm with 128 bits key length, the Diffie–Hellman key exchange with 1536 bits group size, and the SHA-1 hash function */
	
	var diffHell = crypto.createDiffieHellman(prime_length);

	diffHell.generateKeys('base64');
	
	/*Encryption SHA 512 */	
	var secretKey = diffHell.getPrivateKey('hex');
	var hash = crypto.createHmac('sha512', secretKey);
        hash.update(test);
        var value = hash.digest('hex');
	
	/* AES encryption */	
	var AESCrypt = {};
	AESCrypt.decrypt = function(cryptkey, iv, encryptdata) {
	  encryptdata = new Buffer(encryptdata, 'base64').toString('binary');
	  var decipher = crypto.createDecipheriv('aes-256-cbc', cryptkey, iv),
              decoded = decipher.update(encryptdata, 'binary', 'utf8');
	      decoded += decipher.final('utf8');
	      return decoded;
	  }
	
	  AESCrypt.encrypt = function(cryptkey, iv, cleardata) {
	    var encipher = crypto.createCipheriv('aes-256-cbc', cryptkey, iv),
		encryptdata = encipher.update(cleardata, 'utf8', 'binary');
		encryptdata += encipher.final('binary');
		var encode_encryptdata = new Buffer(encryptdata, 'binary').toString('base64');
		return encode_encryptdata;
	  }
	
	  var cryptkey   = crypto.createHash('sha256').update('Nixnogen').digest(),  // SHA 256 : Hash 
	      iv         = 'a2xhcgAAAAAAAAAA',
	      buf        = "Here is some data for the encrypt", // text to be encrypted
	      enc        = AESCrypt.encrypt(cryptkey, iv, buf);
	      var dec    = AESCrypt.decrypt(cryptkey, iv, enc);
	
	/* Fingerprint of the Diffie Hellman Keys SHA-1 */
	var secretKey1 = diffHell.getPrivateKey('hex');
	var hash = crypto.createHmac('sha1', secretKey1);
        hash.update(test);
        var value1 = hash.digest('hex');
	
	var secretKey2 = diffHell.getPublicKey('hex');
	var hash = crypto.createHmac('sha1', secretKey2);
        hash.update(test);
        var value2 = hash.digest('hex');
	
	/* Fingerprint of Diffie Hellman Keys SHA-256 */
	var secretKey3 = diffHell.getPrivateKey('hex');
	var hash = crypto.createHmac('sha256', secretKey3);
        hash.update(test);
        var value3 = hash.digest('hex');
	
	var secretKey4 = diffHell.getPublicKey('hex');
	var hash = crypto.createHmac('sha1', secretKey4);
        hash.update(test);
        var value4 = hash.digest('hex');
	
	/* Output */
	console.log("\n============================AES encryption testing ....============================\n\n");
	console.log("\nencrypt length: ", enc.length);
	console.log("\nencrypt in Base64:", enc);
	console.log("\ndecrypt all: " + dec);
	console.log("=============Generating keys using crypto-js=================================\n\n");
	console.log("\nPublic Key : base64 " ,diffHell.getPublicKey('base64'));
	console.log("\nPrivate Key : base64 " ,diffHell.getPrivateKey('base64'));
        console.log("\nPublic Key : hex " ,diffHell.getPublicKey('hex'));
        console.log("\nPrivate Key : hex " ,diffHell.getPrivateKey('hex'));
	console.log("\n============================SHA512 using key as generated by diffie hellman private key======\n\n");
	console.log("\nHash value : SHA 512",value);
	console.log("\n Original message",test);
	console.log("\n============================FINGERPRINT OF DIFFIE HELLMAN KEY SHA-1========================\n\n");
	console.log("\n Private key ( hex ) : ", value1);
	console.log("\n Public key ( hex ) : " , value2);
	console.log("\n=============================FINGERPRINT OF DIFFIE HELLMAN KEY SHA-256=================\n\n");
	console.log("\n Private key ( hex ) : ", value3);
	console.log("\n Public key ( hex ) : " , value4)
	 
	var end = new Date().getTime();
	var time = end - start;
	console.log("\n=====================Execution time================================\n\n");
	console.log(time);

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
        avatar: this.avatar
    };
});

module.exports = mongoose.model('User', UserSchema);
