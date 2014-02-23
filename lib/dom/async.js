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

  window.setTimeout = function(callback, timeout/*, [args...]*/ ) {
    // Implement parameter passing. This is not supported by node's native implemention
    // so we have to implement it ourselves.
    if (arguments.length > 2) {
      var args = _.toArray(arguments);
      args[1] = window;
      callback = _.bind.apply(_, args);
    }

    timeout = setTimeout(function() {
      pending.pop('timeout', timeout);
      execUser(callback);
    }, timeout);

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
