'use strict';

angular.module('lets-chat')
    .factory('socket', function(socketFactory) {
        return socketFactory();
    })
    .controller('client-controller', function ($scope, $window, socket) {
        $window.socket = socket; // For testing
        $scope.messages = [];
        $scope.rooms = [];
        $scope.glued = true;
        socket.on('connect', function() {
            console.log('connected');
        });
        socket.emit('rooms:join', '123456', function(err, res) {
            console.log(err);
            console.log(res);
        });
        socket.emit('messages:create', {
            text: 'HEY THERE AT ' + Date.now()
        }, function(err) {
            console.log(err)
            console.log('sent!')
        });
        socket.emit('messages:list', {}, function(messages) {
            $scope.messages = messages;
        });
        socket.on('messages:new', function(message) {
            console.log('got message!')
            console.log(message);
            $scope.messages.push(message);
        });
        socket.emit('rooms:list', {}, function(rooms) {
            $scope.rooms = rooms;
        });
        socket.on('rooms:new', function(room) {
            console.log('got room!')
            console.log(room);
            $scope.rooms.push(room);
        });
        $scope.send = function(e) {
            if ($scope.text) {
                socket.emit('messages:create', {
                    text: $scope.text
                }, function(res) {
                    $scope.text = '';
                    $scope.$apply(function() {
                        e && e.preventDefault();
                    });
                });
                return;
            }
        }
    });