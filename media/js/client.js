//
// Client
//

var socket = io.connect();

socket.emit('room:join', '123456', function(err, res) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(res);
})