var Server = require('./server.js');
var config = require('./configuration.js');

var app = new Server(config);

app.start();
