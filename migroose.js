var mongoose = require("mongoose"),
    settings = require('./app/config'),
    migroose = require('migroose'),
    MigrationModel = migroose.MigrationModel,
    Runner = require('migroose-cli/cli/runner/index');

module.exports = {
    connect: function(cb){
        mongoose.connect(settings.database.uri, function(err){
            if (err) { throw err; }
            cb();
        });
    },

    needsMigration: function(cb) {
        var cwd = process.cwd();
        var runner = new Runner(process.cwd(), 'migrootions');
        var migrations = runner.getMigrations();
        var lastMigration = migrations.slice(migrations.length - 1)[0];
        MigrationModel.findOne({migrationId: lastMigration.migrationId}, function(err, model){
            if (model) {
                cb(false);
            } else {
                cb(true);
            }
        });
    }
};
