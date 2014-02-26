var _ = require('lodash');

module.exports = function(window, pending, execUser) {
  var nextTickId = 0;
  window.nextTick = function(callback) {
    var wrapped = pending.wrap('nextTick', nextTickId++, function() {
      execUser(callback);
    });
    process.nextTick(wrapped);
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
