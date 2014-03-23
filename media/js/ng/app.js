'use strict';

angular.module('lets-chat', ['btford.socket-io', 'luegg.directives', 'ui.utils'])
    .config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('{$');
        $interpolateProvider.endSymbol('$}');
    });
