var _ = require('lodash');

module.exports = function Async(window, exec) {
  var pending = exec.pending,
      nextTickId = 0;
  window.nextTick = function(callback) {
    var wrapped = pending.wrap('nextTick', nextTickId++, function() {
      exec.exec(callback);
    });
    process.nextTick(wrapped);
  };

  window.setTimeout = function(callback /*, timeout, [args...]*/ ) {
    // Remap the callback with our own callback to ensure proper event loop tracking
    var args = _.toArray(arguments);
    args[0] = function() {
      var args = arguments;
      exec.exec(function() {
        callback.apply(this, args);
      });

      pending.pop('timeout', timeout);
    };

    var timeout = setTimeout.apply(this, args);

    pending.push('timeout', timeout, function() {
      clearTimeout(timeout);
    });
    return timeout;
  };
  window.clearTimeout = function(timeout) {
    pending.cancel('timeout', timeout);
  };

  window.setImmediate = function(callback) {
    var id = setImmediate(function() {
      exec.exec(callback);
      pending.pop('immediate', id);
    });

    pending.push('immediate', id, function() {
      clearImmediate(id);
    });
    return id;
  };
  window.clearImmediate = function(id) {
    pending.cancel('immediate', id);
  };
};
