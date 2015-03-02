'use strict';

var settings = require('./../config');

function getUserJid(username) {
    if (username.indexOf('@' + settings.xmpp.host) !== -1) {
        return username;
    }
    return username + '@' + settings.xmpp.host;
}

function getRoomJid(roomId, username) {
    var jid = roomId + '@' + settings.xmpp.confhost;
    if (username) {
        jid += '/' + username;
    }
    return jid;
}

function populateVcard(presence, user, core) {
    var vcard = presence.c('x', { xmlns: 'vcard-temp:x:update' });
    var photo = vcard.c('photo');

    var avatar = core.avatars.get(user.id);
    if (avatar) {
        photo.t(avatar.sha1);
    }
}

module.exports = {
    getUserJid: getUserJid,
    getRoomJid: getRoomJid,
    populateVcard: populateVcard
};
