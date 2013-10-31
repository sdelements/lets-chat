
// Validator defaults
$.validator.setDefaults({
    highlight: function(element) {
        $(element).closest('.form-group').addClass('has-error');
    },
    unhighlight: function(element) {
        $(element).closest('.form-group').removeClass('has-error');
    },
    errorElement: 'span',
    errorClass: 'help-block',
    errorPlacement: function(error, element) {
        if(element.parent('.input-group').length) {
            error.insertAfter(element.parent());
        } else {
            error.insertAfter(element);
        }
    }
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
            $(this).toggleClass('alert-danger', isError)
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