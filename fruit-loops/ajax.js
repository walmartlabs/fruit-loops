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
            var xhr = {
              readyState: 4,
              status: response.statusCode,
              responseText: body
            };

            if (!err && response.statusCode === 200) {
              try {
                body = JSON.parse(body);
              } catch (err) {
                body = undefined;
                return options.error(xhr, 'parseerror', err);
              }

              options.success(body, 'success', xhr);
            } else {
              options.error(xhr, 'error', err);
            }
          } finally {
            options.complete();

            log[options.cacheUrl || options.url] = body || false;
            if (options.cacheUrl != options.url) {
              delete log[options.url];
            }

            ajax.emit('complete');
          }
        });
      });
  };

  return ajax;
};
