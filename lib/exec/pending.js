var _ = require('lodash');

/*
 * Implements an internal event-loop approximation.
 *
 * Allows for a given exec context to track the operations that are outstanding
 * and also preempt future execution after end of life events such as emit.
 */
module.exports.create = function() {
  var pending = [];

  return {
    pending: function() {
      return pending.length;
    },

    reset: function() {
      _.each(pending, function(pending) {
        pending.cleanup();
      });
      pending = [];
    },

    push: function(type, id, cleanup) {
      pending.push({
        type: type,
        id: id,
        cleanup: cleanup
      });
    },
    pop: function(type, id) {
      var ret = pending.pop() || {};
      if (ret.type !== type || ret.id !== id) {
        throw new Error('Unbalanced event stack: '
            + 'expected: ' + type + ':' + id
            + '  found: ' + ret.type + ':' + ret.id);
      }
    },
    cancel: function(type, id) {
      var len = pending.length;
      while (len--) {
        var check = pending[len];
        if (check.type === type && check.id === id) {
          check.cleanup();
          pending.splice(len, 1);
          return;
        }
      }

      throw new Error('Pending event ' + type + ':' + id + ' not found.');
    }
  };
};
