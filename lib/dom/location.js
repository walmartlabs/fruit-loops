var url = require('url');

module.exports = function(window, href, redirect) {
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

  [window, window.document].forEach(function(obj) {
    Object.defineProperty(obj, 'location', {
      enumerable: true,
      get: function() {
        return location;
      },
      set: function(value) {
        redirect(value);
      }
    });
  });
};
