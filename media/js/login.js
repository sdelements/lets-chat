//= require vendor/md5/md5.js

+function() {

    function onSubmit(form, callbacks) {
        var $form = $(form);
        $.ajax({
            type: 'POST',
            url: $form.attr('action'),
            data: $form.serialize(),
            dataType: 'json',
            complete: getLoginCallback($form)
        });
    }

    function getLoginCallback($form) {
        return function(res, text) {
            switch(res.status) {
                case 200:
                case 201:
                    swal('Success', res.responseJSON.message, 'success');
                    $form.hasClass('lcb-login-box-login') && $('.sweet-alert').each(function() {
                        $(this).find('.confirm').hide();
                        $(this).find('p').css('margin-bottom', '20px');
                    });
                    if ($form.data('refresh')) {
                        setTimeout(function() {
                            window.location =
                                './' + (window.location.hash || '');
                        }, 1000);
                        return;
                    }
                    $form[0].reset();
                    $('.lcb-show-box:visible').click();
                    break;
                case 400:
                    swal('Woops',
                         res.responseJSON && res.responseJSON.message,
                         'error');
                    break;
                case 401:
                    swal('Woops.',
                         'Your username or password is not correct',
                         'warning');
                    break;
                case 403:
                    swal('Woops.',
                         'Your account is locked',
                         'warning');
                    break;
                default:
                    swal('Woops.',
                         'A server error has occured',
                         'error');
                    break;
            }
            // $indicator.removeClass('loading');
            // Clear some inputs
            $form.find('[data-clear="true"]').val('');
        };
    }

    $(function() {
        // JVFloat
        $('input[placeholder]').jvFloat();
        // Switch between login boxes
        $('.lcb-show-box').on('click', function() {
            var $target = $('html').find($(this).data('target'));
            if ($target.length > 0) {
                $target.siblings('.lcb-login-box').hide();
                $target.show();
            }
        });
        // Show avatar
        $('[action="./account/login"] [name="username"]').on('blur', function(e) {
            var email = $(this).val();
            var valid = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
            if (valid) {
                $('.lcb-login-avatar')
                    .attr('src', 'https://www.gravatar.com/avatar/' + md5(email) + '?s=100?d=mm')
                    .addClass('show');
            } else {
                $('.lcb-login-avatar').removeClass('show');
            }
        });
        // Validation
        $('form.validate').each(function() {
            $(this).validate({
                submitHandler: onSubmit
            });
        });
    });
}();
