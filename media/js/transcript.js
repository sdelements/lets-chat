//= require vendor/bootstrap-daterangepicker/daterangepicker.js
//= require util/message.js
//= require views/transcript.js

$(function() {
    var transcript = new window.LCB.TranscriptView({
        room: {
            id: $('#room_id').val(),
            name: $('#room_name').val()
        }
    });
});
