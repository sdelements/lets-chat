'use strict';

var mongoose = require('mongoose'),
    MessageProcessor = require('./../msg-processor');

module.exports = MessageProcessor.extend({

    if: function() {
        return this.request.type === 'get' && this.ns['vcard-temp'];
    },

    then: function(cb) {
        var jid = this.connection.jid();
        var other = this.to && this.to !== jid;

        if (!other) {
            return this.sendVcard(this.connection.user, cb);
        }

        var username = this.to.split('@')[0];
        var user = this.core.presence.users.getByUsername(username);

        if (user) {
            return this.sendVcard(user, cb);
        }

        var User = mongoose.model('User');
        User.findByIdentifier(username, function(err, user) {
            if (!err && user) {
                this.sendVcard(user, cb);
            }
        }.bind(this));
    },

    sendVcard: function(user, cb) {
        var stanza = this.Iq();

        var vcard = stanza.c('vCard', {
            xmlns: 'vcard-temp'
        });

        vcard.c('FN').t(user.firstName + ' ' + user.lastName);


        var name = vcard.c('N');
        name.c('GIVEN').t(user.firstName);
        name.c('FAMILY').t(user.lastName);

        vcard.c('NICKNAME').t(user.username);

        vcard.c('JABBERID').t(this.connection.getUserJid(user.username));

        var userId = (user.id || user._id).toString();

        var avatar = this.core.avatars.get(userId);
        if (avatar) {
            var photo = vcard.c('PHOTO');
            photo.c('TYPE').t('image/jpeg');
            photo.c('BINVAL').t(avatar.base64);
        }

        cb(null, stanza);
    }

});
