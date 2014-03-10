//
// Client
//

var socket = io.connect();

socket.emit('rooms:join', '123456', function(err, res) {
    if (err) {
        console.error(err);
        return;
    }
    console.log(res);
})

socket.emit('messages:create', {
    text: 'Hey bro, I like your style.'
}, function(err) {
    console.log(err)
    console.log('sent!')
})

socket.on('messages:new', function(message) {
    console.log('got!')
    console.log(message);
})