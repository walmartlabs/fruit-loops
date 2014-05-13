var _ = require('lodash'),
    async = require('async'),
    fs = require('fs'),
    page = require('./page'),
    Path = require('path');


module.exports = function Pool(options) {
  var cache = {queue: [], pages: [], free: []},
      watching = {};

  if (!options || !options.poolSize) {
    throw new Error("Must pass in a poolSize value");
  }

  return {
    info: function() {
      return {
        queued: cache.queue.length,
        pages: cache.pages.length,
        free: cache.free.length
      };
    },

    navigate: function(path, callback) {
      return getPage(this, cache, options, watching, path, callback);
    },
    dispose: function() {
      _.each(cache.pages, function(page) {
        page.dispose();
      });

      _.each(watching, function(watcher) {
        watcher.close();
      });

      cache = {queue: [], pages: [], free: []};
      watching = {};
    }
  };
};

function getPage(pool, cache, options, watching, path, callback) {
  function finalize(err, data) {
    function returnToQueue() {
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
    }

    // Notify the caller after we've restored the page to the queue
    callback.apply(this, arguments);
    callback = undefined;

    if (!err && options.cleanup) {
      setImmediate(function() {
        options.cleanup(page, returnToQueue);
      });
    } else {
      returnToQueue();
    }
  }

  var page;
  if (cache.free.length) {
    // Execute the instance from an existing 
    page = cache.free.pop();
    page.navigate(path, finalize);

    // Exec navigated within a pending block to ensure that events added as part of the pending
    // call are run if the pending call also calls emit.
    if (options.navigated) {
      page.pending.push('navigate', 1, function() {});
      options.navigated(page, true);
      page.pending.pop('navigate', 1);
    }
  } else if (cache.pages.length < options.poolSize) {
    // Spin up a new page instance.
    page = createPage(pool, options, watching, path, finalize);
    cache.pages.push(page);
  } else {
    // We hit our pool limit. Defer execution until we have
    // a VM entry available.
    cache.queue.push(_.toArray(arguments));
  }

  return page;
}

function createPage(pool, options, watching, path, initialCallback) {
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

  // Track loaded file if in develoopment mode so we can avoid some server restarts
  if (!options.cacheResources) {
    var $resolver = options.resolver || function(href) {
      return Path.resolve(Path.join(Path.dirname(options.index), href));
    };

    options.resolver = function(href) {
      href = $resolver.apply(this, arguments);

      if (!watching[href]) {
        // Blow away all page instances if any files change
        watching[href] = fs.watch(href, {persistent: false}, function() {
          pool.dispose();
        });
      }

      return href;
    };
  }

  return page(options);
}
