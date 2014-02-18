var _ = require('lodash'),
    Events = require('events'),
    exec = require('../exec').exec,
    Nipple = require('nipple'),
    request = require('request');

var CACHABLE_STATUS = {
  200: true,
  203: true,
  206: true,
  300: true,
  301: true,
  410: true
};

// TODO : Remove this in favor of HAPI smart caching
// TODO : Make this conditional as users that implement user behavior on the server will not
// want this.
var cache = {};

module.exports = exports = function($, pending) {
  var ajax = new Events.EventEmitter(),
      requests,
      log,
      minimumCache,
      counter = 0;

  ajax.minimumCache = function() {
    return minimumCache;
  };

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
    minimumCache = {
      'no-cache': false,
      private: false,
      expires: Number.MAX_VALUE
    };

    this.removeAllListeners();
  };

  $.ajax = function(options) {
    var jsonp;
    if (/=\?/.test(options.url)) {
      options.url = options.url.replace('=?', '=$jsonp$');
      jsonp = true;
    }

    var xhr = {
      _id: counter++,
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

          // Update our minimum caching duration for the entire response
          var cachingInfo = (response && response.cachingInfo) || exports.cachingInfo(response);
          exports.calcCache(minimumCache, cachingInfo);

          if (!fromCache && type === 'success' && requestType === 'GET') {
            // Reparsing here to ensure that we have a clean object for future users
            cache[options.url] = body ? {caching: cachingInfo, data: JSON.parse(xhr.responseText)} : false;
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
          pending.pop('ajax', xhr._id);
        }
      });
    }

    pending.push('ajax', xhr._id, function() {
      xhr.abort();
    });

    var requestType = options.type || 'GET';
    if (requestType === 'GET' && cache[options.url]) {
      setImmediate(function() {
        var cacheEntry = cache[options.url];
        callback(
            undefined,
            {statusCode: 200, cachingInfo: cacheEntry.caching},
            _.cloneDeep(cacheEntry.data));
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

  // Ensure that everything is initialized
  ajax.reset();

  return ajax;
};

/*
 * Normalizes caching information defined in a response.
 */
exports.cachingInfo = function(res) {
  // Will failover to no-cache state
  res = res || {headers: {}, request: {}};

  var cacheControl = res.headers['cache-control'],
      expires = res.headers.expires,
      pragma = res.headers.pragma,

      cacheable = CACHABLE_STATUS[res.statusCode] && res.request.method === 'GET',

      noCache,
      expires;

  if (cacheControl) {
    cacheControl = Nipple.parseCacheControl(cacheControl);

    noCache = (!cacheable && !cacheControl.public) || !!cacheControl['no-cache'];

    // Converting to explicit timeout so we don't inadvertantly extend the cache
    // lifecycle when serving cached responses in the future
    expires = Date.now() + parseInt(cacheControl['max-age'], 0)*1000;
  } else {
    noCache = !cacheable || pragma === 'no-cache';
    expires = Date.parse(expires).valueOf();
  }

  if (isNaN(expires) || noCache) {
    expires = undefined;
  }

  return {
    'no-cache': !!noCache,
    private: !!(cacheControl && cacheControl.private),
    expires: expires
  };
};

/*
 * Determines the most restrictive caching arguments given two inputs.
 */
exports.calcCache = function(minimumCache, cachingInfo) {
  minimumCache['no-cache'] = minimumCache['no-cache'] || cachingInfo['no-cache'];
  minimumCache.private = minimumCache.private || cachingInfo.private;
  minimumCache.expires = Math.min(minimumCache.expires, cachingInfo.expires);
  if (isNaN(minimumCache.expires) || minimumCache['no-cache']) {
    minimumCache.expires = undefined;
  }
};

exports.reset = function() {
  cache = {};
};

