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
      requests = [],
      log = {};

  ajax.toJSON = function() {
    return JSON.stringify(log);
  };
  ajax.allComplete = function() {
    return !_.any(log, function(value) { return value === null; });
  };
  ajax.reset = function() {
    log = {};
    _.each(requests, function(request) {
      request.abort();
    });

    this.removeAllListeners();
  };

  $.ajax = function(options) {
    var jsonp;
    if (/=\?/.test(options.url)) {
      options.url = options.url.replace('=?', '=$jsonp$');
      jsonp = true;
    }

    var xhr = {
      readyState: 2
    };

    function callback(err, response, body) {
      // TODO : Handle any cookie info that might be necessary
      exec(function() {
        var type;
        try {
          xhr.readyState = 4;
          xhr.status = response && response.statusCode;
          xhr.responseText = body;

          if (!err && response.statusCode === 200) {
            try {
              if (jsonp) {
                body = body.replace(/.*?\$jsonp\$\((.*)\).*?$/, '$1');
              }

              body = JSON.parse(body);
            } catch (err) {
              body = undefined;
              type = 'parsererror';
              return options.error && options.error(xhr, type, err);
            }

            type = 'success';
            options.success && options.success(body, type, xhr);
          } else {
            body = false;
            type = 'error';
            options.error && options.error(xhr, type, err);
          }
        } finally {
          options.complete && options.complete(xhr, type);

          if (requestType === 'GET') {
            cache[options.url] = body ? xhr.responseText : false;
          }

          log[options.cacheUrl || options.url] = body || false;
          if (options.cacheUrl !== options.url) {
            delete log[options.url];
          }

          ajax.emit('complete', options.url);
        }
      });
    }

    var requestType = options.type || 'GET';
    if (requestType === 'GET' && cache[options.url]) {
      process.nextTick(function() {
        callback(undefined, {statusCode: 200}, cache[options.url]);
      });
      xhr.readyState = 4;
      return xhr;
    }

    log[options.url] = null;
    requests.push(
      request({
          method: requestType,
          url: options.url,
          form: options.data
        },
        callback));

    return xhr;
  };

  return ajax;
};
