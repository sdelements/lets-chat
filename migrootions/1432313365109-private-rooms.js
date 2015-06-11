var Migroose = require('migroose');
var Room = require('./../app/models/room');
var migration = new Migroose.Migration('1432313365109-private-rooms');

migration.step(function(data, stepComplete) {
  var query = { password: { $exists: true, $nin: [ '', null ] }};

  Room.update(query, { private: true }, { multi: true}, function(err) {
      stepComplete(err);
  })
});

module.exports = migration;
