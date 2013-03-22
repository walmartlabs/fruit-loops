module.exports = function(window, name) {
  // TODO : Look into serialization between the server and the client
  var cache = {};

  window[name] = {
    getItem: function(value) {
      return cache[value];
    },
    setItem: function(value, key) {
      cache[value] = key;
    },

    get length() {
      return _.keys(cache).length;
    }
  };
};
