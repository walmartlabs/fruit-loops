var _ = require('lodash'),
    Events = require('events');

/*
 * Implements an internal event-loop approximation.
 *
 * Allows for a given exec context to track the operations that are outstanding
 * and also preempt future execution after end of life events such as emit.
 */
module.exports.create = function() {
  var pending = [],
      log = [],
      maxPending = 0;

  function pop(type, id, log) {
    var len = pending.length;
    while (len--) {
      var check = pending[len];
      if (check.type === type && check.id === id) {
        pending.splice(len, 1);

        _.extend(check.log, log);
        check.log.duration = Date.now() - check.log.start;

        return check;
      }
    }
  }

  return _.extend(new Events.EventEmitter(), {
    pending: function() {
      return pending.length;
    },
    log: function() {
      return log;
    },
    maxPending: function() {
      return maxPending;
    },

    reset: function() {
      _.each(pending, function(pending) {
        pending.cleanup && pending.cleanup();
      });
      pending = [];
      log = [];
      maxPending = 0;
      this.removeAllListeners();
    },

    push: function(type, id, cleanup) {
      log.push({
        type: type,
        id: id,

        start: Date.now()
      });
      pending.push({
        type: type,
        id: id,
        cleanup: cleanup,

        log: log[log.length - 1]
      });

      maxPending = Math.max(pending.length, maxPending);
    },
    pop: function(type, id, log) {
      var pending = pop(type, id, log);
      if (pending) {
        this.emit('pop');
      }
    },
    cancel: function(type, id, log) {
      var pending = pop(type, id, log);
      if (pending) {
        pending.log.cancelled = true;
        pending.cleanup && pending.cleanup();
        this.emit('pop');
      }
    },

    /*
     * Helper method that links the push+pop+cancel methods and ties it to the
     * execution of a given callback. Prevents execution of the callback after cancellation
     * for async methods that are otherwise not cancellable.
     */
    wrap: function(type, id, callback) {
      var pending = this,
          cancel = false;

      pending.push(type, id, function() {
        cancel = true;
      });

      return function() {
        if (cancel) {
          return;
        }

        var ret = callback.apply(this, arguments);

        // We want to pop after exec so we maintain the pending count
        pending.pop(type, id);

        return ret;
      };
    }
  });
};
