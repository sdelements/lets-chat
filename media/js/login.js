$(function() {

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
