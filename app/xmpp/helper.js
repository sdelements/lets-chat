'use strict';

var settings = require('./../config');

function getUserJid(userId) {
    return userId + '@' + settings.xmpp.host;
}

function getRoomJid(roomId, userId) {
    var jid = roomId + '@' + settings.xmpp.confhost;
    if (userId) {
        jid += '/' + userId;
    }
    return jid;
}

module.exports = {
    getUserJid: getUserJid,
    getRoomJid: getRoomJid
};
