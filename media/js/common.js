Marionette.Renderer.render = function(template, data) {
    if (typeof template === 'function') {
        return template(data);
    }

    var self = Marionette.Renderer.render;

    if (!self.cache) {
        self.cache = {};
    }

    if (!self.cache[template]) {
        self.cache[template] = Handlebars.compile($(template).html());
    }

    return self.cache[template](data);
};


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
        } else if(element.parent().parent('.input-group').length) {
            error.insertAfter(element.parent().parent());
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
    time = moment(time).calendar();
    $this.text(time);
};

$(function() {

    // Refresh timestamps just after midnight

    var oneMinutePastMidnight = moment()
                                .endOf('day')
                                .add(1, 'minutes')
                                .diff(moment());

    var interval = moment.duration(24, 'hours').asMilliseconds();

    setTimeout(function() {
        setInterval(function() {
            $('time').each(function() {
                $(this).updateTimeStamp();
            });
        }, interval);
    }, oneMinutePastMidnight);

});
