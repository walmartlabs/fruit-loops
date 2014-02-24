var _ = require('lodash');

module.exports = function(window, pending, execUser) {
  window.nextTick = function(callback) {
    // Not cancelable, so no advantage to giving a proper identifier
    pending.push('nextTick', 1, function() {});
    process.nextTick(function() {
      pending.pop('nextTick', 1);
      execUser(callback);
    });
  };

  window.setTimeout = function(callback /*, timeout, [args...]*/ ) {
    // Remap the callback with our own callback to ensure proper event loop tracking
    var args = _.toArray(arguments);
    args[0] = function() {
      pending.pop('timeout', timeout);

      var args = arguments;
      execUser(function() {
        callback.apply(this, args);
      });
    };

    var timeout = setTimeout.apply(this, args);

    pending.push('timeout', timeout, function() {
      clearTimeout(timeout);
    });
    return timeout;
  };
  window.clearTimeout = function(timeout) {
    pending.cancel('timeout', timeout, true);
  };

  window.setImmediate = function(callback) {
    var id = setImmediate(function() {
      pending.pop('immediate', id);
      execUser(callback);
    });

    pending.push('immediate', id, function() {
      clearImmediate(id);
    });
    return id;
  };
  window.clearImmediate = function(id) {
    pending.cancel('immediate', id, true);
  };
};
