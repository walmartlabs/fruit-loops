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

function Ajax() {
  Events.EventEmitter.call(this);
}
Ajax.prototype = Object.create(Events.EventEmitter.prototype);

module.exports = exports = function(window, exec, options) {
  var ajax = new Ajax(),

      ajaxCache = options && options.cache,
      shortCircuit = options && options.shortCircuit,
      globalTimeout = options && options.timeout,

      requests,
      xhrs,
      responses,
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
        + _.map(responses, function(value, key) {
          // Safe escape </ in content to prevent </script> from causing invalid
          // early tag termination.
          var safeValue = value;
          if (safeValue) {
            // Multiple replace operations with string are apparently optimized in v8, vs. regexs
            // http://jsperf.com/javascript-multiple-replace/2
            safeValue = safeValue
                .replace(/<\//g, '<\\/')
                .replace(/<!/g, '<\\!');
          }

          return '"' + key + '": ' + safeValue; }).join(',')
      + '}';
  };
  ajax.allComplete = function() {
    return !_.any(responses, function(value) { return value === null; });
  };
  ajax.reset = function() {
    _.each(requests, function(request) {
      request.abort();
    });
    _.each(xhrs, function(xhr) {
      // Prevent any execution when requests tied to the cache return.
      xhr.readyState = 4;
    });

    requests = [];
    xhrs = [];
    responses = {};
    minimumCache = {
      'no-cache': false,
      private: false,
      expires: Number.MAX_VALUE
    };

    this.removeAllListeners();
  };
  ajax.dispose = function() {
    window = window.$.ajax = undefined;
  };

  window.$.ajax = function(options) {
    var originalUrl = options.url,
        req,
        jsonp;

    // Timeout is minimum of client and global timeout
    var timeout = options.timeout = Math.min(options.timeout || Infinity, globalTimeout || Infinity),
        cacheTimeout;
    if (timeout === Infinity) {
      timeout = undefined;
    }

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
            callback('abort');
          } else {
            xhr.readyState = 4;
          }
        }
      }
    };

    function callback(err, response, cache, report) {
      // Prevent exec if we were for example aborted but the cache request came in
      if (xhr.readyState === 4) {
        return;
      }

      clearTimeout(cacheTimeout);

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

          // If we have a succcess case, include the timing
          var cacheLookup = report && report.msec;
          if (report instanceof Error) {
            // If we saw an error then pass in the object verbatium
            cacheLookup = report;
          }

          // Store the response in the request log to send to the user
          if (type === 'success') {
            responses[options.cacheUrl || originalUrl] = xhr.responseText || false;
            if (options.cacheUrl && options.cacheUrl !== originalUrl) {
              delete responses[originalUrl];
            }
          } else {
            delete responses[originalUrl];
          }

          ajax.emit('complete', originalUrl);
          exec.pending.pop('ajax', xhr._id, {
            url: options.cacheUrl || originalUrl,
            method: options.type,
            status: type,
            statusCode: xhr.status,
            cacheLookup: cacheLookup,
            cached: !!cache
          });
        }
      });
    }
    function startTimeout() {
      if (timeout) {
        cacheTimeout = setTimeout(function() {
          callback(new Error('ETIMEDOUT'));
        }, timeout);
      }
    }

    exec.pending.push('ajax', xhr._id, function() {
      xhr.abort(true);
    });
    xhrs.push(xhr);

    // Mark the request as in progress
    responses[originalUrl] = null;

    if (shortCircuit && shortCircuit(options, callback)) {
      // NOP, we were able to short circuit the request

      // Do a custom timeout here as we don't know how to directly cancel the
      // upstream request.
      startTimeout();

      return xhr;
    }

    function generateFunc(next) {
      execRequest(options, jsonp, undefined, function(err, response) {
        if (err) {
          return next(err);
        }

        var ttl = 0;
        if (!response.cachingInfo['no-cache'] && !response.cachingInfo.private) {
          ttl = response.cachingInfo.expires - Date.now();
        }

        next(undefined, response, ttl);
      });
    }

    if (ajaxCache && (!options.type || options.type === 'GET')) {
      ajaxCache.getOrGenerate(options.url, generateFunc, callback);

      // Do a custom timeout here so we can prime the cache for future requests
      startTimeout();
    } else {
      req = execRequest(options, jsonp, timeout, callback);
      requests.push(xhr);
    }

    return xhr;
  };

  // Ensure that everything is initialized
  ajax.reset();

  return ajax;
};



function execRequest(options, jsonp, timeout, callback) {
  return request({
      method: options.type || 'GET',
      url: options.url,
      form: options.data,
      headers: {
        'User-Agent': 'fruit-loops ' + Package.version
      },

      timeout: timeout
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

      callback(undefined, ret);
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
