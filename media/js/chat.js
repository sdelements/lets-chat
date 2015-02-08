$(function() {
    var client = new window.LCB.Client({
        uploadsEnabled: $('#lcb-upload').length > 0
    });
    client.start();
});
