var _ = require('underscore'),
    Events = require('events'),
    exec = require('../client-exec').exec,
    request = require('request');

module.exports = function($) {
  var ajax = new Events.EventEmitter(),
      log = {};

  ajax.toJSON = function() {
    return JSON.stringify(log);
  };
  ajax.allComplete = function() {
    return !_.any(_.values(log), function(value) { return value === null; });
  };

  $.ajax = function(options) {
    console.log(options.url);
    log[options.url] = null;
    request({
        method: options.type || 'GET',
        url: options.url,
        form: options.data
      },
      function(err, response, body) {
        // TODO : Handle any cookie info that might be necessary
        exec(function() {
          try {
            if (!err && response.statusCode === 200) {
              try {
                body = JSON.parse(body);
              } catch (err) {
                body = undefined;
                return options.error({}, 'parseerror', err);
              }

              options.success(body, 'success', {});
            } else {
              console.log(err, response, body);
              options.error({}, 'error', err);
            }
          } finally {
            options.complete();

            log[options.url] = body || false;
            ajax.emit('complete');
          }
        });
      });
  };

  return ajax;
};
