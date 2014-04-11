var url = require('url');

module.exports = function Location(window, href, redirect) {
  function reset(href) {
    var location = url.parse(href);
    location.host = location.hostname + (location.port ? ':' + location.port : '');
    location.path = location.pathname;
    location.origin = location.protocol + '//' + location.host;
    location.hash = '';

    location.assign = function(url) {
      redirect(url);
    };

    location.toString = function() {
      return url.format(location);
    };
    return location;
  }

  var location = reset(href);

  [window, window.document].forEach(function(obj) {
    Object.defineProperty(obj, 'location', {
      enumerable: true,
      configurable: true,
      get: function() {
        return location;
      },
      set: function(value) {
        redirect(value);
      }
    });
  });

  return {
    // This allows us to define the location property only once, avoiding the memory leak
    // outlined here: https://github.com/joyent/node/issues/7454
    reset: function(href) {
      location = reset(href);
    }
  };
};
