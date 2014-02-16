var _ = require('lodash'),
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
    // Custom seralization so we don't have to bounce back and forth between object
    // and string representation
    // NOTE: This assumes that no URLS are going to have the literal " (or any other non-encoded
    // javascript illegal characters)
    return '{'
        + _.map(log, function(value, key) { return '"' + key + '": ' + value; }).join(',')
      + '}';
  };
  ajax.allComplete = function() {
    return !_.any(log, function(value) { return value === null; });
  };
  ajax.reset = function() {
    _.each(requests, function(request) {
      request.abort();
    });

    requests = [];
    log = {};
    this.removeAllListeners();
  };

  $.ajax = function(options) {
    var jsonp;
    if (/=\?/.test(options.url)) {
      options.url = options.url.replace('=?', '=$jsonp$');
      jsonp = true;
    }

    var xhr = {
      readyState: 2,

      abort: function() {
        if (xhr.readyState === 2) {
          req.abort();
          callback('abort', undefined, '');
        }
      }
    };

    function callback(err, response, body) {
      // TODO : Handle any cookie info that might be necessary
      exec(function() {
        var type,
            fromCache = false;
        try {
          xhr.readyState = 4;
          xhr.status = (response && response.statusCode) || 0;
          xhr.responseText = body;

          if (!err && response.statusCode === 200) {
            if (_.isString(body) || Buffer.isBuffer(body)) {
              try {
                if (jsonp) {
                  body = body.replace(/.*?\$jsonp\$\((.*)\).*?$/, '$1');
                  xhr.responseText = body;
                }

                body = JSON.parse(body);
              } catch (err) {
                body = undefined;
                type = 'parsererror';
                return options.error && options.error(xhr, type, err);
              }
            } else {
              fromCache = true;
            }

            type = 'success';
            options.success && options.success(body, type, xhr);
          } else {
            body = false;
            type = err === 'abort' ? err : 'error';
            options.error && options.error(xhr, type, err);
          }
        } finally {
          options.complete && options.complete(xhr, type);

          if (!fromCache && type === 'success' && requestType === 'GET') {
            // Reparsing here to ensure that we have a clean object for future users
            cache[options.url] = body ? JSON.parse(xhr.responseText) : false;
          }

          // Store the response in the request log to send to the user
          if (type === 'success') {
            log[options.cacheUrl || options.url] = xhr.responseText || false;
            if (options.cacheUrl && options.cacheUrl !== options.url) {
              delete log[options.url];
            }
          } else {
            delete log[options.url];
          }

          ajax.emit('complete', options.url);
        }
      });
    }

    var requestType = options.type || 'GET';
    if (requestType === 'GET' && cache[options.url]) {
      setImmediate(function() {
        callback(undefined, {statusCode: 200}, _.cloneDeep(cache[options.url]));
      });
      xhr.readyState = 4;
      return xhr;
    }

    // Mark the request as in progress
    log[options.url] = null;

    var req = request({
        method: requestType,
        url: options.url,
        form: options.data
      },
      callback);
    requests.push(xhr);

    return xhr;
  };

  return ajax;
};

module.exports.reset = function() {
  cache = {};
};
