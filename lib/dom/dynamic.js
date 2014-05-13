var _ = require('lodash');

module.exports = function Dynamic(window, options) {
  /*jshint evil:true,-W024,-W067 */

  // Target the global objects
  window = window.window;

  if (!options.evil) {
    window.eval = function() {
      throw new Error('SecurityError: dynamic code must be enabled with evil flag');
    };

    var $Function = window.Function;
    window.Function = function() {
      throw new Error('SecurityError: dynamic code must be enabled with evil flag');
    };
    window.Function.prototype = $Function.prototype;
  }

  var $setTimeout = window.setTimeout;
  window.setTimeout = function(callback, timeout/*, [args...]*/ ) {
    var args = arguments;

    if (typeof callback === 'string') {
      if (!options.evil) {
        throw new Error('SecurityError: dynamic code must be enabled with evil flag');
      } else {
        // Implement our own callback method to handle eval of string parameter input
        // as node does not natively support this.
        args = _.toArray(arguments);
        args[0] = function() {
          // Force global exec
          // http://perfectionkills.com/global-eval-what-are-the-options
          (1,window.eval)(callback);
        };
      }
    }

    return $setTimeout.apply(this, args);
  };
};
