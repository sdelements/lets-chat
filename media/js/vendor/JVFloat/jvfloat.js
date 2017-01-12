/*
 * JVFloat.js
 * modified on: 18/09/2014
 */

(function($) {
  'use strict';
  
  // Init Plugin Functions
  $.fn.jvFloat = function () {
    // Check input type - filter submit buttons.
    return this.filter('input:not([type=submit]), textarea, select').each(function() {
      function getPlaceholderText($el) {
        var text = $el.attr('placeholder');

        if (typeof text == 'undefined') {
            text = $el.attr('title');
        }

        return text;
      }
      function setState () {
        // change span.placeHolder to span.placeHolder.active
        var currentValue = $el.val();

        if (currentValue == null) {
          currentValue = '';
        }
        else if ($el.is('select')) {
          var placeholderValue = getPlaceholderText($el);

          if (placeholderValue == currentValue) {
            currentValue = '';
          }
        }

        placeholder.toggleClass('active', currentValue !== '');
      }
      function generateUIDNotMoreThan1million () {
        var id = '';
        do {
          id = ('0000' + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
        } while (!!$('#' + id).length);
        return id;
      }
      function createIdOnElement($el) {
        var id = generateUIDNotMoreThan1million();
        $el.prop('id', id);
        return id;
      }
      // Wrap the input in div.jvFloat
      var $el = $(this).wrap('<div class=jvFloat>');
      var forId = $el.attr('id');
      if (!forId) { forId = createIdOnElement($el);}
      // Store the placeholder text in span.placeHolder
      // added `required` input detection and state
      var required = $el.attr('required') || '';
      
      // adds a different class tag for text areas (.jvFloat .placeHolder.textarea) 
      // to allow better positioning of the element for multiline text area inputs
      var placeholder = '';
      var placeholderText = getPlaceholderText($el);

      if ($(this).is('textarea')) {
        placeholder = $('<label class="placeHolder ' + ' textarea ' + required + '" for="' + forId + '">' + placeholderText + '</label>').insertBefore($el);
      } else {
        placeholder = $('<label class="placeHolder ' + required + '" for="' + forId + '">' + placeholderText + '</label>').insertBefore($el);
      }
      // checks to see if inputs are pre-populated and adds active to span.placeholder
      setState();
      $el.bind('keyup blur', setState);
    });
  };
// Make Zeptojs & jQuery Compatible
})(window.jQuery || window.Zepto || window.$);
