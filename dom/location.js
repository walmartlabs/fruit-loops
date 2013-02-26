var url = require('url');

module.exports = function(window, href) {
  var location = url.parse(href);
  location.host = location.hostname + (location.port ? ':' + location.port : '');
  location.path = location.pathname;
  location.origin = location.protocol + '//' + location.host;
  location.hash = '';

  location.assign = function(url) {};

  // TODO : Handle redirects either through location assignment or assign/replace methods
  window.location = location;
};
