'use strict';

angular.module('lets-chat', ['btford.socket-io'])
    .config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('{$');
        $interpolateProvider.endSymbol('$}');
    });
