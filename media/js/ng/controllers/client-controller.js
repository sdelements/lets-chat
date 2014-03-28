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
        $scope.sendMessage = function(e) {
            if ($scope.forms.message.text) {
                socket.emit('messages:create', {
                    text: $scope.forms.message.text
                }, function(res) {
                    $scope.forms.message.text = '';
                    $scope.$apply(function() {
                        e && e.preventDefault();
                    });
                });
                return;
            }
        }
        $scope.createRoom = function(e) {
            if ($scope.forms.room.name) {
                socket.emit('rooms:create', {
                    name: $scope.forms.room.name,
                    description: $scope.forms.room.description
                }, function(res) {
                    $scope.forms.room.name = '';
                    $scope.forms.room.description = '';
                    $scope.$apply(function() {
                        e && e.preventDefault();
                    });
                });
                return;
            }
        }
    });