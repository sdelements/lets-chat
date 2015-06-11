var Migroose = require('migroose');
var async = require('async');
var User = require('./../app/models/user');
var migration = new Migroose.Migration('1421183479874-users');

migration.load({
    external_users: {
        collection: 'users',
        query: { uid: { $exists: true } }
    },
    local_users: {
        collection: 'users',
        query: { uid: { $exists: false } }
    }
});

migration.step(function(data, stepComplete) {

    function getUsername(displayName) {
        return displayName.trim()
                          .toLowerCase()
                          .replace(/[\W\&]+/ig, '_')
                          .replace(/_+/ig, '_')
                          .replace(/^_+/ig, '')
                          .replace(/_+$/ig, '');
    }

    function updateDoc(item, callback) {
        User.findById(item._id, function(err, doc) {
            if (err) {
                console.error(err);
                return callback(err);
            }

            if (doc.uid) {

                if (!doc.provider) {
                    doc.provider = 'kerberos';
                }
                if (!doc.username) {
                    doc.username = doc.uid;
                }

            } else {

                if (!doc.provider) {
                    doc.provider = 'local';
                }
                if (!doc.username) {
                    doc.username = getUsername(doc.displayName);
                }
            }

            // TODO: Need to handle conflict
            doc.save(function(err) {
                if (err) {
                    console.error(err);
                    return callback(err);
                }

                callback();
            });
        });
    }

    var users = data.external_users.documents.concat(data.local_users.documents);

    async.each(users, updateDoc, function(err) {
        stepComplete(err);
    });
});

module.exports = migration;
