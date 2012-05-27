//
// Letschatbro
//

var config = require('./settings.js');
var Server = require('./app/server.js');

var app = new Server(config);

app.start();
