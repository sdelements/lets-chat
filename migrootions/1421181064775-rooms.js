var Migroose = require('migroose');
var async = require('async');
var Room = require('./../app/models/room');
var migration = new Migroose.Migration('1421181064775-add-room-slugs');

migration.load({
    rooms: {
        collection: 'rooms',
        query: {
            slug: {$exists: false }
        }
    }
});

migration.step(function(data, stepComplete) {

    function getSlug(name) {
        return name.trim()
                   .toLowerCase()
                   .replace(/[\W\&]+/ig, '_')
                   .replace(/_+/ig, '_')
                   .replace(/^_+/ig, '')
                   .replace(/_+$/ig, '');
    }

    function updateDoc(item, callback) {
        if (item.slug) {
            return callback();
        }

        Room.findById(item._id, function(err, doc) {
            doc.slug = getSlug(doc.name);


            // TODO: Need to handle conflict
            doc.save(function(err) {
                callback();
            });
        });
    }

    async.each(data.rooms, updateDoc, function(err) {
        stepComplete();
    });
});

module.exports = migration;
