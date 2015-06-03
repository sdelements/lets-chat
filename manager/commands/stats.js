'use strict';

var _ = require('lodash'),
    async = require('async');

function Stats(options) {

    var that = this;

    this.program = options.program;

    this.models = options.models;

    this.program
      .command('stats [thing]')
      .description('List stats')
      .action(function(thing, options) {

          async.parallel({
              users: that.countUsers.bind(that),
              messages: that.countMessages.bind(that),
              rooms: that.countRooms.bind(that)
          }, function(err, results) {
              if (err) {
                  throw new Error(err);
                  return;
              }
              console.log('STATS');
              console.log('------------');
              _.each(results, function(result, name) {
                  console.log(name + ': ' + result);
              });
              process.exit(0);
          });

      });
}

Stats.prototype.countUsers = function(cb) {

    this.models.user.count().exec(cb);

}

Stats.prototype.countRooms = function(cb) {

    this.models.room.count().exec(cb);

}

Stats.prototype.countMessages = function(cb) {

    this.models.message.count().exec(cb);
    
}

module.exports = Stats;