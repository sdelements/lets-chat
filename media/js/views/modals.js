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
            this.render();
        },
        render: function() {
            this.$('form.validate').validate();
            this.$el.on('shown.bs.modal hidden.bs.modal', _.bind(this.refresh, this));
        },
        refresh: function() {
            this.$('[name="display-name"]').val(this.model.get('displayName'));
            this.$('[name="first-name"]').val(this.model.get('firstName'));
            this.$('[name="last-name"]').val(this.model.get('lastName'));
        },
        submit: function(e) {
        	e && e.preventDefault();
            var $form = this.$('form[action]');
            $.ajax({
                type: $form.attr('method') || 'POST',
                url: $form.attr('action'),
                data: $form.serialize(),
                dataType: 'json',
                success: _.bind(function(res) {
                    swal('Profile Updated!', 'Your profile has been updated.', 'success');
                    this.$el.modal('hide');
                }, this),
                error: function(res) {
                    swal('Woops!', 'Your profile was not updated.', 'error');
                }
            });
        }
    });

}(window, $, _);