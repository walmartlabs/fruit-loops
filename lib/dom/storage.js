var _ = require('lodash');

module.exports = function Storage(window, name) {
  /*jshint es5:true */
  var cache = {};

  window[name] = {
    getItem: function(value) {
      return cache[value];
    },
    setItem: function(value, key) {
      cache[value] = key;
    },
    removeItem: function(value) {
      delete cache[value];
    },
    key: function(index) {
      return _.keys(cache)[index];
    },

    get length() {
      return _.keys(cache).length;
    },
    clear: function() {
      cache = {};
    }
  };

  return {
    reset: function() {
      window[name].clear();
    },
    dispose: function() {
      window = window[name] = undefined;
    }
  };
};
