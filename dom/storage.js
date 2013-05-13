var _ = require('underscore');

// TODO : Remove this in favor of HAPI smart caching
// TODO : Make this conditional as users that implement user behavior on the server will not
// want this.
var globalCache = {};

module.exports = function(window, name) {
  var cache = globalCache[name] = globalCache[name] || {};

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

    get length() {
      return _.keys(cache).length;
    }
  };
};
