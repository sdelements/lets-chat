var Migroose = require('migroose');
var async = require('async');
var User = require('./../app/models/user');
var migration = new Migroose.Migration('1421183479874-users');

migration.load({
    users: 'users'
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
                callback();
            });
        });
    }

    async.each(data.users, updateDoc, function(err) {
        stepComplete();
    });
});

module.exports = migration;
