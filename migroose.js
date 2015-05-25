'use strict';

var mongoose = require('mongoose'),
    settings = require('./app/config'),
    migroose = require('migroose'),
    Runner = require('migroose-cli/cli/runner/index');

var MigrationModel = migroose.MigrationModel;

module.exports = {
    connect: function(cb){
        mongoose.connect(settings.database.uri, function(err){
            if (err) { throw err; }
            cb();
        });
    },

    needsMigration: function(cb) {
        var runner = new Runner(process.cwd(), 'migrootions');
        var migrations = runner.getMigrations();
        var lastMigration = migrations.slice(migrations.length - 1)[0];
        MigrationModel.findOne({migrationId: lastMigration.migrationId}, function(err, model) {
            if (err) {
                return cb(err);
            }

            if (model) {
                cb(null, false);
            } else {
                cb(null, true);
            }
        });
    }
};
