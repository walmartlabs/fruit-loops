module.exports = function(window, pending, execUser) {
  window.nextTick = function(callback) {
    // Not cancelable, so no advantage to giving a proper identifier
    pending.push('nextTick', 1, function() {});
    process.nextTick(function() {
      execUser(callback);
      pending.pop('nextTick', 1);
    });
  };

  window.setTimeout = function(callback, timeout) {
    timeout = setTimeout(function() {
      execUser(callback);
      pending.pop('timeout', timeout);
    }, timeout);

    pending.push('timeout', timeout, function() {
      clearTimeout(timeout);
    });
    return timeout;
  };
  window.clearTimeout = function(timeout) {
    pending.cancel('timeout', timeout);
  };
};
