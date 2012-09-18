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

$(function() {

	var submitForm = function(form, callbacks) {
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
				if (res.status == 'success') {
					window.location = '/';
				}
			},
			error: function(res) {
				self.setMessage('A server error has occured.', 'error');
			},
			complete: function() {
				self.$indicator.removeClass('loading');
			}
		})
	}

	// Setup validator
	$('form.validate').each(function() {
		$(this).validate({
			submitHandler: function(form) {
				submitForm(form)
			}
		});
	});

	// Toggle forms
	$('.show-form').on('click', function(e) {
		e.preventDefault();
		$('.well[id$=form]').each(function() {
			$(this).find('input').qtip('destroy');
            $(this).hide();
		});
        $($(this).data('target')).show();
	});
});
