// load our stuff
var Server = require('./server.js')

// config
var config = require('./configuration.js')

var app = new Server(config)

// Start it all
app.start()
