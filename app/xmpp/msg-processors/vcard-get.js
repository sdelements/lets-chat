'use strict';

var mongoose = require('mongoose'),
    MessageProcessor = require('./../msg-processor'),
    settings = require('./../../config'),
    helper = require('./../helper');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['vcard-temp'];
    },

    then: function(cb) {
        var jid = helper.getUserJid(this.client.conn.username);
        var other = this.to && this.to !== jid;

        var sendVcard = function (user) {
            var stanza = this.Iq();

            var v = stanza.c('vCard', {
             xmlns: 'vcard-temp'
            });

            v.c('FN').t(user.firstName + ' ' + user.lastName);


            var name = v.c('N');
            name.c('GIVEN').t(user.firstName);
            name.c('FAMILY').t(user.lastName);

            v.c('NICKNAME').t(user.username);

            cb(null, stanza);

        }.bind(this);

        if (other) {
            var User = mongoose.model('User');
            var username = this.to.split('@')[0];
            User.findByIdentifier(username, function(err, user) {
                if (user) {
                    sendVcard(user);
                }
            });
        } else {
            sendVcard(this.client.user);
        }
    }

});
