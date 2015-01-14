/*
 * MODAL VIEWS
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ProfileModalView = Backbone.View.extend({
        events: {
        	'submit form': 'submit'
        },
        initialize: function(options) {
        	this.client = options.client
        	this.user = options.client
        },
        submit: function(e) {
        	e && e.preventDefault();
        	var displayName = this.$('[name="display-name"]').val(),
        		firstName = this.$('[name="first-name"]').val(),
        		lastName = this.$('[name="last-name"]').val();

        	this.client.events.trigger('users:update', {
        		displayName: displayName,
        		firstName: firstName,
        		lastName: lastName,
        		id: this.client.user.id
        	});

        	this.$el.modal('hide');
        }
    });

}(window, $, _);