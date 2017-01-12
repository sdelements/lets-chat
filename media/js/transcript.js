//= require vendor/bootstrap-daterangepicker/daterangepicker.js
//= require util/message.js
//= require views/transcript.js

$(function() {
    var transcript = new window.LCB.TranscriptView({
        el: '.lcb-transcript',
        room: {
            id: $('[name="room-id"]').val(),
            name: $('[name="room-name"]').val()
        }
    });
});
