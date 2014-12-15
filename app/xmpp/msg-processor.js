'use strict';

var xmpp = require('node-xmpp-server'),
    Stanza = require('node-xmpp-core').Stanza,
    mongoose = require('mongoose'),
    settings = require('./../config'),
    _ = require('underscore'),
    util = require('util');

function MessageProcessor(client, request, core) {
    this.client = client;
    this.request = request;
    this.core = core;

    this.run = this.run.bind(this);
    this.send = this.send.bind(this);

    this.Stanza = this.Stanza.bind(this);
    this.Iq = this.Iq.bind(this);
    this.Message = this.Message.bind(this);
    this.Presence = this.Presence.bind(this);
}

MessageProcessor.prototype.Stanza = function(name, attr) {
    attr = _.extend({
        type: 'result',
        id: this.request.attrs.id,
        to: this.request.attrs.from,
        from: this.request.attrs.to
    }, attr || {});

    return new Stanza.Stanza(name, attr);
};

MessageProcessor.prototype.Iq = function(attr) {
    return this.Stanza('iq', attr);
};

MessageProcessor.prototype.Presence = function(attr) {
    return this.Stanza('presence', attr);
};

MessageProcessor.prototype.Message = function(attr) {
    return this.Stanza('message', attr);
};

MessageProcessor.prototype.preRun = function() {
    this.to = this.request.attrs.to || '';

    this.toConfRoot = this.to.indexOf(settings.xmpp.confhost) === 0;
    this.toARoom = this.to.indexOf('@' + settings.xmpp.confhost) !== -1;

    this.ns = this.ns || {};

    this.request.children.forEach(function(child) {
        if (child.attrs && child.attrs.xmlns) {
            this.ns[child.attrs.xmlns] = child;
        }
    }, this);
};

MessageProcessor.prototype.run = function() {
    this.preRun();

    if (this.if && this.if()) {
        this.then(function() {

            if (!arguments || !arguments.length) {
                return;
            }

            var err = arguments[0],
                msgs = Array.prototype.slice.call(arguments, 1);

            if (err) {
                console.error(err);
                return;
            }

            this.send(msgs);

        }.bind(this));
        return true;
    }

    return false;
};

MessageProcessor.prototype.send = function(msgs) {
    if (settings.xmpp.debug.handled) {
        console.log(' ');
        console.log(this.request.root().toString().blue);
    }

    msgs = _.flatten(msgs);

    msgs.forEach(function(msg) {
        if (settings.xmpp.debug.handled) {
            console.log(msg.root().toString().green);
        }
        this.client.send(msg);
    }, this);
};

MessageProcessor.extend = function(options) {
    var processor = function() {
        MessageProcessor.apply(this, arguments);
        this.if = this.if.bind(this);
        this.then = this.then.bind(this);
    };

    util.inherits(processor, MessageProcessor);

    processor.prototype.if = options.if;
    processor.prototype.then = options.then;

    return processor;
};

module.exports = MessageProcessor;
