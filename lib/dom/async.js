var _ = require('lodash');

module.exports = function Async(window, exec) {
  var pending = exec.pending,
      idCounter = 0;
  window.nextTick = function(callback) {
    var wrapped = pending.wrap('nextTick', idCounter++, function() {
      exec.exec(callback);
    });
    process.nextTick(wrapped);
  };

  window.setTimeout = function(callback /*, timeout, [args...]*/ ) {
    // Remap the callback with our own callback to ensure proper event loop tracking
    var args = _.toArray(arguments),
        duration = args[1];
    args[0] = function() {
      var args = arguments;
      exec.exec(function() {
        callback.apply(this, args);
      });

      pending.pop('timeout', id, {
        requested: duration
      });
    };

    var timeout = setTimeout.apply(this, args),
        id = idCounter++;

    pending.push('timeout', id, function() {
      clearTimeout(timeout);
    });
    return id;
  };
  window.clearTimeout = function(timeout) {
    pending.cancel('timeout', timeout);
  };

  window.setImmediate = function(callback) {
    var timeout = setImmediate(function() {
      exec.exec(callback);
      pending.pop('immediate', id);
    });
    var id = idCounter++;

    pending.push('immediate', id, function() {
      clearImmediate(timeout);
    });
    return id;
  };
  window.clearImmediate = function(id) {
    pending.cancel('immediate', id);
  };

  return {
    dispose: function() {
      window = window.nextTick =
          window.setTimeout = window.clearTimeout =
          window.setImmediate = window.clearImmediate = undefined;
    }
  };
};
