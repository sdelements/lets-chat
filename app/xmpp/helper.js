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

module.exports = {
    getUserJid: getUserJid,
    getRoomJid: getRoomJid
};
