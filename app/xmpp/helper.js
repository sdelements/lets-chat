'use strict';

var settings = require('./../config');

function getUserJid(screenName) {
    return screenName + '@' + settings.xmpp.host;
}

function getRoomJid(roomId, screenName) {
    var jid = roomId + '@' + settings.xmpp.confhost;
    if (screenName) {
        jid += '/' + screenName;
    }
    return jid;
}

module.exports = {
    getUserJid: getUserJid,
    getRoomJid: getRoomJid
};
