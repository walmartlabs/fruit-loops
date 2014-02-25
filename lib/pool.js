var _ = require('lodash'),
    async = require('async'),
    page = require('./page'),
    path = require('path');


module.exports = function(options) {
  var cache = {queue: [], pages: [], free: []};

  if (!options || !options.poolSize) {
    throw new Error("Must pass in a poolSize value");
  }

  return {
    navigate: function(path, callback) {
      return getPage(cache, options, path, callback);
    },
    dispose: function() {
      _.each(cache.pages, function(page) {
        page.dispose();
      });

      cache = undefined;
    }
  };
};

function getPage(cache, options, path, callback) {
  function finalize(err, data) {
    if (cache.queue.length) {
      // If there are pending calls then we continue them.
      var queued = cache.queue.shift();
      setImmediate(function() {
        getPage.apply(this, queued);
      });
    }

    if (!err) {
      // Return the page to the pool
      cache.free.push(page);
    } else {
      // If we errored assume that we are in some sort of broken state and destroy the page
      page.dispose();

      cache.pages.splice(cache.pages.indexOf(page), 1);
    }

    // Notify the caller after we've restored the page to the queue
    callback.apply(this, arguments);
  }

  var page;
  if (cache.free.length) {
    // Execute the instance from an existing 
    page = cache.free.pop();
    page.navigate(path, finalize);
    options.navigated && options.navigated(page, true);
  } else if (cache.pages.length < options.poolSize) {
    // Spin up a new page instance.
    page = createPage(options, path, finalize);
    cache.pages.push(page);
  } else {
    // We hit our pool limit. Defer execution until we have
    // a VM entry available.
    cache.queue.push(_.toArray(arguments));
  }

  return page;
}

function createPage(options, path, initialCallback) {
  options = _.defaults({
    path: path,
    callback: initialCallback
  }, options);

  // Instrument the navigated callback for the initial page load
  if (options.navigated) {
    var $loaded = options.loaded;

    options.loaded = function(page) {
      $loaded && $loaded.apply(this, arguments);

      options.navigated(page, false);
    };
  }

  return page(options);
}
