'use strict';

var _ = require('lodash'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.name === 'message' &&
               this.request.type === 'chat' &&
               !this.toARoom &&
               this.request.attrs.to;
    },

    then: function(cb) {
        if (!settings.private.enable) {
            return cb();
        }

        var username = this.request.attrs.to.split('@')[0];

        var body = _.find(this.request.children, function (child) {
            return child.name === 'body';
        });

        if (!body) {
            return cb();
        }

        this.core.users.username(username, function(err, user) {
            if (err) {
                return cb(err);
            }

            if (!user) {
                return cb();
            }

            this.core.usermessages.create({
                owner: this.connection.user.id,
                user: user._id,
                text: body.text(),
                data: {
                    id: this.request.attrs.id
                }
            }, function(err) {
                cb(err);
            });

        }.bind(this));
    }

});
