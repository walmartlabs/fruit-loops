var _ = require('underscore'),
    Events = require('events'),
    exec = require('../exec').exec,
    request = require('request');

// TODO : Remove this in favor of HAPI smart caching
// TODO : Make this conditional as users that implement user behavior on the server will not
// want this.
var cache = {};

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
    function callback(err, response, body) {
      // TODO : Handle any cookie info that might be necessary
      exec(function() {
        try {
          var xhr = {
            readyState: 4,
            status: response && response.statusCode,
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
            body = false;
            options.error(xhr, 'error', err);
          }
        } finally {
          options.complete();

          log[options.cacheUrl || options.url] = body || false;
          cache[options.url] = body ? JSON.stringify(body) : false;
          if (options.cacheUrl !== options.url) {
            delete log[options.url];
          }

          ajax.emit('complete');
        }
      });
    }

    if (cache[options.url]) {
      process.nextTick(function() {
        callback(undefined, {statusCode: 200}, cache[options.url]);
      });
      return;
    }

    log[options.url] = null;
    request({
        method: options.type || 'GET',
        url: options.url,
        form: options.data
      },
      callback);
  };

  return ajax;
};
