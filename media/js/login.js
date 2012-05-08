<<<<<<< HEAD
$(function () {
    $('#login .toggle-register').click(function () {
        var $register = $('#login .register');
        var $form = $('#login form');
        var $link = $('#login .toggle-register');
        var $button = $('#login .btn')
        if ($register.is(':visible')) {
            $form.attr('action', '/login');
            $register.slideUp();
            $link.text('New? Create an account.');
            $button.val('Login')
        } else {
            $form.attr('action', '/register');
            $register.slideDown();
            $link.text('Actually, I have an account.');
            $button.val('Register')
        }
    });
=======
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
>>>>>>> origin/master
});

$.validator.addMethod('alphanumeric', function(value, element) {
	return this.optional(element) || /^[a-z0-9]+$/i.test(value);
}, 'Only letters and numbers are allowed');

$(document).ready(function() {
	
	var submitForm = function(form, callbacks) {
		var self = this;
		this.$form = $(form);
		this.setMessage = function(text, type, delay) {
			self.$form.find('.response').each(function () {
				var isError = type == 'error' ? true : false;
				$(this).text(text);
				$(this).toggleClass('error', isError)
					.toggleClass('success', !isError)
					.stop(true, true)
					.fadeIn(100);
				if (delay) {
					$(this).delay(delay).fadeOut(200);
				}
			});
		}
		$.ajax({
			type: 'POST',
			url: $form.attr('action'),
			data: $form.serialize(),
			dataType: 'json',
			// TODO: Make this better with a custom callbacks
			success: function(res) {
				self.setMessage(res.message, res.status);
				// TODO: Make this better
				if (res.status == 'success') {
					window.location = '/';
				}
			},
			// TODO: Maybe warn the user about a server issue?
			error: function(res) {
				self.setMessage(res.message, res.status);
			}
		})
	}

	$('form.validate').each(function() {
		$(this).validate({
			submitHandler: function(form) {
				submitForm(form)
			}
		});
	});

});
