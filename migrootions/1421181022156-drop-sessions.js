var Migroose = require('migroose');
var migration = new Migroose.Migration('1421181022156-drop-sessions');

migration.drop('sessions');

module.exports = migration;
