var url = require('url');

module.exports = function Location(window, href, redirect) {
  function reset(href) {
    var location = url.parse(href);
    location.host = location.hostname + (location.port ? ':' + location.port : '');
    location.path = location.pathname;
    location.origin = location.protocol + '//' + location.host;
    location.search = location.search || '';
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

  Object.defineProperty(window.document, 'location', {
    enumerable: true,
    configurable: false,
    get: function() {
      return location;
    },
    set: function(value) {
      redirect(value);
    }
  });

  return {
    // This allows us to define the location property only once, avoiding the memory leak
    // outlined here: https://github.com/joyent/node/issues/7454
    reset: function(href) {
      location = reset(href);
    },
    dispose: function() {
      // Explicitly clean up these references as the GC either does not or defers collecting
      // of all of this and by proxy the page object when the redirect reference remains.
      location = redirect = undefined;
    }
  };
};

module.exports.preInit = function(baseContext) {
  Object.defineProperty(baseContext, 'location', {
    enumerable: true,
    configurable: false,

    get: function() {
      return baseContext.document.location;
    },
    set: function(value) {
      baseContext.document.location = value;
    }
  });
};
