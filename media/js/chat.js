//= require util/eggs.js
//= require util/message.js
//= require models.js
//= require views/notifications.js
//= require views/browser.js
//= require views/room.js
//= require views/status.js
//= require views/window.js
//= require views/panes.js
//= require views/modals.js
//= require views/upload.js
//= require views/client.js
//= require client.js

$(function() {
    var client = new window.LCB.Client({
        uploadsEnabled: $('#lcb-upload').length > 0
    });
    client.start();
});
