(function ($) {
 
/**
 * Controller for clear.
 */
var pi = termkit.clear = function () {
  var that = this;

  this.$element = this.$markup();
};

pi.prototype = {
  
  // Return active markup for this field.
  $markup: function () {
    var $clear = $('<div class="termkitClear">').data('controller', this);
    var that = this;
    return $clear;
  },

};

///////////////////////////////////////////////////////////////////////////////

})(jQuery);
