
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
$.validator.addMethod('alphanum', function(value, element) {
	return this.optional(element) || /^[a-z0-9]+$/i.test(value);
}, 'Only letters and numbers are allowed');

// Setup Validators
$(function() {
    $('form.validate').each(function() {
        $(this).validate({
            submitHandler: function(form, callbacks) {
                var $form = $(form);
                var setMessage = function(text, type, delay) {
                    $form.find('.response').each(function () {
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
                };
                $.ajax({
                    type: 'POST',
                    url: $form.attr('action'),
                    data: $form.serialize(),
                    dataType: 'json',
                    complete: function(res) {
                        switch(res.status) {
                            case 200:
                            case 201:
                                setMessage(res.responseJSON.message, 'success');
                                if ($form.data('refresh')) {
                                    window.location = '/';
                                }
                                break;
                            case 401:
                                setMessage(res.responseJSON.message || 'Your username or password is not correct', 'error');
                                break;
                            default:
                                setMessage(res.responseJSON.message || 'A server error has occured', 'error');
                                break;
                        }
                        // $indicator.removeClass('loading');
                        // Clear some inputs
                        $form.find('[data-clear="true"]').val('');
                    }
                });
            }
        });
    });
});