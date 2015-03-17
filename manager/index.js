'use strict';

var _ = require('lodash'),
    program = require('commander'),
    all = require('require-tree'),
    mongoose = require('mongoose');

var settings = require('../app/config'),
    models = all('../app/models'),
    core = require('../app/core/index');

function Manager() {

    var that = this;

    this.program = program;

    this.program
      .version('0.0.1');

    this.commands = {};

    mongoose.connection.on('error', function (err) {

        throw new Error(err);

    });

    mongoose.connection.on('disconnected', function() {

        throw new Error('Could not connect to database');

    });

    mongoose.connect(settings.database.uri, function(err) {

        if (err) {
            throw new Error(err);
            return;
        }

        _.each(all('./commands'), function(Command, id) {

            that.commands[id] = new Command({
                program: program,
                models: models,
                core: core
            });

        });

        program.parse(process.argv);

        if (!process.argv.slice(2).length) {

            that.program.outputHelp();

        }
 
    });

}

module.exports = Manager;