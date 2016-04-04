'use strict';

var Stanza = require('node-xmpp-server').Stanza,
    settings = require('./../config'),
    _ = require('lodash'),
    util = require('util');

function MessageProcessor(client, request, core) {
    this.client = client;
    this.connection = client.conn;
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
        id: this.request.attrs.id,
        to: this.request.attrs.from,
        from: this.request.attrs.to
    }, attr || {});

    return new Stanza(name, attr);
};

MessageProcessor.prototype.Iq = function(attr) {
    attr = _.extend({
        type: 'result'
    }, attr || {});

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

    var confDomain = this.connection.getConfDomain();
    this.toConfRoot = this.to.indexOf(confDomain) === 0;
    this.toARoom = this.to.indexOf('@' + confDomain) !== -1;

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

        _.forEach(this.methods, function(key) {
            this[key] = this[key].bind(this);
        }.bind(this));
    };

    util.inherits(processor, MessageProcessor);

    processor.prototype.methods = [];

    _.forEach(options, function(value, key) {
        processor.prototype.methods.push(key);
        processor.prototype[key] = value;
    });

    return processor;
};

module.exports = MessageProcessor;
