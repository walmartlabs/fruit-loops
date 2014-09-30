var url = require('url');

module.exports = function Location(window, href) {
  var location = new url.Url();

  location.assign = function(url) {
    window.FruitLoops.redirect(url);
  };

  location.toString = function() {
    return url.format(location);
  };

  function reset(href) {
    location.parse(href, true);
    location.host = location.hostname + (location.port ? ':' + location.port : '');
    location.path = location.pathname;
    location.origin = location.protocol + '//' + location.host;
    location.search = location.search || '';
    location.hash = '';
  }

  reset(href);

  Object.defineProperty(window.document, 'location', {
    enumerable: true,
    configurable: false,
    get: function() {
      return location;
    },
    set: function(value) {
      window.FruitLoops.redirect(value);
    }
  });

  return {
    // This allows us to define the location property only once, avoiding the memory leak
    // outlined here: https://github.com/joyent/node/issues/7454
    reset: function(href) {
      reset(href);
    },
    dispose: function() {
      // Explicitly clean up these references as the GC either does not or defers collecting
      // of all of this and by proxy the page object when the redirect reference remains.
      window = location = undefined;
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

  return {
    dispose: function() {
      baseContext = undefined;
    }
  };
};
