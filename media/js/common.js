
// Validator defaults
jQuery.validator.setDefaults({
	onkeyup: false,
	errorClass: 'error',
	validClass: 'valid',
	errorPlacement: function(error, element) {
		//Set positioning based on the elements position in the form
		var elem = $(element),
			corners = ['right center', 'left center'],
			flipIt = elem.parents('span.right').length > 0;
		//Check we have a valid error message
		if(!error.is(':empty')) {
			// Apply the tooltip only if it isn't valid
			elem.filter(':not(.valid)').qtip({
				overwrite: false,
				content: error,
				position: {
					my: corners[ flipIt ? 0 : 1 ],
					at: corners[ flipIt ? 1 : 0 ],
					viewport: $(window)
				},
				show: {
					event: false,
					ready: true
				},
				hide: false,
				style: {
					classes: 'ui-tooltip-red ui-tooltip-rounded'
				}
			})
			// If we have a tooltip on this element already, just update its content
			.qtip('option', 'content.text', error);
		}
		// If the error is empty, remove the qTip
		else { elem.qtip('destroy'); }
	},
	success: $.noop // Odd workaround for errorPlacement not firing!
});
$.validator.addMethod('alphanumeric', function(value, element) {
	return this.optional(element) || /^[a-z0-9]+$/i.test(value);
}, 'Only letters and numbers are allowed');

// Generic form callback
window.submitForm = function(form, callbacks) {
    var self = this;
    this.$form = $(form);
    this.$indicator = $(form).find('.indicator');
    this.setMessage = function(text, type, delay) {
        self.$form.find('.response').each(function () {
            var isError = type == 'error' ? true : false;
            $(this).text(text);
            $(this).toggleClass('alert-error', isError)
                .toggleClass('alert-success', !isError)
                .stop(true, true)
                .fadeIn(100);
            if (delay) {
                $(this).delay(delay).fadeOut(200);
            }
        });
    }
    this.$indicator.addClass('loading');
    $.ajax({
        type: 'POST',
        url: $form.attr('action'),
        data: $form.serialize(),
        dataType: 'json',
        // TODO: Make this better with a custom callbacks
        success: function(res) {
            self.setMessage(res.message, res.status);
            // TODO: Make this better
            if (res.status == 'success' && $form.data('refresh')) {
                window.location = '/';
            }
        },
        error: function(res) {
            self.setMessage('A server error has occured.', 'error');
        },
        complete: function() {
            self.$indicator.removeClass('loading');
            // Clear some inputs
            $form.find('[data-clear="true"]').val('');
        }
    })
}

// Setup validators
$(function() {
    $('form.validate').each(function() {
        var options = {};
        var $confirm = $(this).find('input[name="confirm-password"]');
        if ($confirm.length > 0 && $confirm.data('equal-to')) {
            options.rules = {
                'confirm-password': {
                    equalTo: $confirm.data('equal-to')
                }
            }
        }
        options.submitHandler = function(form) {
            window.submitForm(form);
        }
        $(this).validate(options);
    });
});