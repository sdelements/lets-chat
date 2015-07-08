//= require util/message.js
//= require models.js
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
    window.client = new window.LCB.Client({
        filesEnabled: $('#lcb-upload').length > 0,
        giphyEnabled: $('#lcb-giphy').length > 0
    });
    window.client.start();
});
