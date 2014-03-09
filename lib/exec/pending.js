var _ = require('lodash'),
    Events = require('events');

/*
 * Implements an internal event-loop approximation.
 *
 * Allows for a given exec context to track the operations that are outstanding
 * and also preempt future execution after end of life events such as emit.
 */
module.exports.create = function() {
  var pending = [];

  function pop(type, id) {
    var len = pending.length;
    while (len--) {
      var check = pending[len];
      if (check.type === type && check.id === id) {
        pending.splice(len, 1);
        return check;
      }
    }
  }

  return _.extend(new Events.EventEmitter(), {
    pending: function() {
      return pending.length;
    },

    reset: function() {
      _.each(pending, function(pending) {
        pending.cleanup && pending.cleanup();
      });
      pending = [];
      this.removeAllListeners();
    },

    push: function(type, id, cleanup) {
      pending.push({
        type: type,
        id: id,
        cleanup: cleanup
      });
    },
    pop: function(type, id) {
      var pending = pop(type, id);
      if (pending) {
        this.emit('pop');
      }
    },
    cancel: function(type, id) {
      var pending = pop(type, id);
      if (pending) {
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
