//
// Login JS
//

+function() {
    $(function() {
        // Switch between login boxes
        $('.lcb-show-box').on('click', function() {
            var $target = $('html').find($(this).data('target'));
            if ($target.length > 0) {
                $target.siblings().hide();
                $target.show();
            }
        });
    });
}();