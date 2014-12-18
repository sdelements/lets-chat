
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

$.fn.updateTimeStamp = function() {
    var $this = $(this);
    var time = $this.attr('title');
    time = moment(time).fromNow();
    $this.text(time);
};

setInterval(function() {
    $('time').each(function() {
        $(this).updateTimeStamp();
    });
}, 60000);
