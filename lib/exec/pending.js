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

    throw new Error('Pending event ' + type + ':' + id + ' not found.');
  }

  return _.extend(new Events.EventEmitter(), {
    pending: function() {
      return pending.length;
    },

    reset: function() {
      _.each(pending, function(pending) {
        pending.cleanup();
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
      pop(type, id);
      this.emit('pop');
    },
    cancel: function(type, id) {
      pop(type, id).cleanup();
      this.emit('pop');
    }
  });
};
