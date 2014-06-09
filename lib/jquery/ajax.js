var _ = require('lodash'),
    Events = require('events'),
    Nipple = require('nipple'),
    request = require('request'),
    Url = require('url');

var Package = require('../../package');

var CACHABLE_STATUS = {
  200: true,
  203: true,
  206: true,
  300: true,
  301: true,
  410: true
};

module.exports = exports = function Ajax(window, exec, ajaxCache) {
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

  window.$.ajax = function(options) {
    var originalUrl = options.url,
        req,
        jsonp;
    if (/=\?/.test(options.url)) {
      options.url = options.url.replace('=?', '=$jsonp$');
      jsonp = true;
    }

    // Relative URL, handle as appropriate
    options.url = Url.resolve(window.location.toString(), options.url);

    var xhr = {
      _id: counter++,
      readyState: 2,

      abort: function(hard) {
        if (xhr.readyState === 2) {
          req && req.abort();
          if (!hard) {
            callback('abort', undefined, '');
          } else {
            xhr.readyState = 4;
          }
        }
      }
    };

    function callback(err, response) {
      // Prevent exec if we were for example aborted but the cache request came in
      if (xhr.readyState === 4) {
        return;
      }

      // Provide failover for legacy catbox initial responses
      if (response && response.toCache) {
        response = response.toCache();
      }

      exec.exec(function() {
        var type = 'success';
        try {
          xhr.readyState = 4;
          xhr.status = (response && response.statusCode) || 0;
          xhr.responseText = (response && response.responseText) || (err && err.responseText) || '';

          if (!err && response.statusCode === 200) {
            options.success && options.success(response.data, type, xhr);
          } else {
            type = _.isString(err) ? err : (err && err.type) || 'error';
            options.error && options.error(xhr, type, err);
          }
        } finally {
          options.complete && options.complete(xhr, type);

          // Update our minimum caching duration for the entire response
          exports.calcCache(minimumCache, (response && response.cachingInfo) || {});

          // Store the response in the request log to send to the user
          if (type === 'success') {
            log[options.cacheUrl || originalUrl] = xhr.responseText || false;
            if (options.cacheUrl && options.cacheUrl !== originalUrl) {
              delete log[originalUrl];
            }
          } else {
            delete log[originalUrl];
          }

          ajax.emit('complete', originalUrl);
          exec.pending.pop('ajax', xhr._id);
        }
      });
    }

    exec.pending.push('ajax', xhr._id, function() {
      xhr.abort(true);
    });

    if (ajaxCache && (!options.type || options.type === 'GET')) {
      ajaxCache.getOrGenerate(options.url, function(callback) {
          execRequest(options, true, jsonp, callback);
        },
        callback);
    } else {
      // Mark the request as in progress
      log[originalUrl] = null;

      req = execRequest(options, false, jsonp, callback);
      requests.push(xhr);
    }

    return xhr;
  };

  // Ensure that everything is initialized
  ajax.reset();

  return ajax;
};



function execRequest(options, caching, jsonp, callback) {
  return request({
      method: options.type || 'GET',
      url: options.url,
      form: options.data,
      headers: {
        'User-Agent': 'fruit-loops ' + Package.version
      }
    },
    function(err, response, body) {
      if (err) {
        return callback(err);
      }

      // Parse the content
      var object;
      if (response.statusCode === 200) {
        if (_.isString(body) || Buffer.isBuffer(body)) {
          try {
            if (jsonp) {
              body = body.replace(/.*?\$jsonp\$\((.*)\).*?$/, '$1');
            }

            object = JSON.parse(body);
          } catch (err) {
            return callback({
              type: 'parsererror',
              responseText: body
            });
          }
        }
      }

      var ret = {
        statusCode: response.statusCode,
        cachingInfo: exports.cachingInfo(response),
        data: object,
        responseText: body
      };

      // If this is a cachable response then return it as such
      if (caching && !ret.cachingInfo['no-cache'] && !ret.cachingInfo.private) {
        callback(undefined, ret, ret.cachingInfo.expires - Date.now());
      } else {
        callback(undefined, ret, true);
      }
    });
}

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
  minimumCache['no-cache'] = !!(minimumCache['no-cache'] || cachingInfo['no-cache']);
  minimumCache.private = !!(minimumCache.private || cachingInfo.private);
  minimumCache.expires = Math.min(minimumCache.expires, cachingInfo.expires || 0);
  if (isNaN(minimumCache.expires) || minimumCache['no-cache']) {
    minimumCache.expires = undefined;
  }
};
