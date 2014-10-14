var _ = require('lodash'),
    async = require('async'),
    Contextify = require('contextify'),
    dom = require('./dom'),
    Exec = require('./exec'),
    fs = require('fs'),
    jQuery = require('./jquery'),
    path = require('path');

var pageCache = {},
    scriptCache = {},
    windowId = 0;

// Load the client mode scripts.
// Load sync here as it's only done on init and we are loading from a known local file. This
// is somewhat akin to a deferred require in that manner.
var ClientScripts = [
  __dirname + '/bootstrap/window.js'
].map(function(href) {
  var src = fs.readFileSync(href);
  return Contextify.createScript(src.toString(), href);
});

module.exports = exports = function(options) {
  var context = new Window(),
      _id = windowId++,

      // We need to set this up here to ensure that the defineProperty propagates properly to the
      // context
      // https://github.com/joyent/node/commit/3c5ea410ca56da3d4785e2563cb2724364669fd2
      locationPreInit = dom.location.preInit(context);

  context = Contextify.createContext(context);

  var host = options.host || 'localhost',
      protocol = options.protocol || 'http:',
      callback = options.callback,
      emitCallbacks = [],
      scripts,

      exec = Exec.create(_callback),
      pending = exec.pending,
      window = context.getGlobal(),
      requestId = 0,
      pageCount = 1,      // Number of times this page has navigated
      $,

      status = 200;

  // Primary external API
  var FruitLoops = {
    id: _id,
    start: process.hrtime(),

    hrtime: function(start) {
      // The c code impl of hrtime expects a literal number of arguments.
      if (start) {
        return process.hrtime(start);
      } else {
        return process.hrtime();
      }
    },

    redirect: function(url) {
      _callback(undefined, {redirect: url});

      // Cancel futher exec
      throw new exec.RedirectError(url);
    },
    statusCode: function(_status) {
      status = _status;
    },

    emit: function(after) {
      function checkComplete() {
        if (isComplete()) {
          var associatedRequestId = requestId;
          setImmediate(function() {
            // Avoid a race condtion where pooled requests may come in while we still have
            // pending emit calls. This will generally only happen for very chatty emit callers.
            if (requestId === associatedRequestId) {
              emit();
            }
          });
        }
      }
      function isComplete() {
        if (after === 'ajax') {
          return $.ajax.allComplete();
        } else if (after === 'events') {
          return !pending.pending();
        } else {
          // If we are in immediate mode (i.e. the default behavior) then we
          // always consider ourselves complete.
          return true;
        }
      }

      if (!callback) {
        // This should be considered a framework error as the pending tracker
        // should prevent this from happening.
        throw new Error('Emit outside of request: ' + _id);
      }

      if (after === 'ajax') {
        $.ajax.once('complete', checkComplete);
      } else if (after === 'events') {
        pending.on('pop', checkComplete);
      }

      // If it doesn't look like anything is running or we have an explicit emit
      // then defer the exec and emit if nothing comes into the queue for the remainder
      // of the tick.
      if (isComplete()) {
        setImmediate(function() {
          checkComplete();
        });
      }
    },
    onEmit: function(callback) {
      emitCallbacks.push(callback);
    },

    loadInContext: function(href, callback) {
      try {
        if (options.resolver) {
          href = options.resolver(href, page);
        } else {
          href = path.resolve(path.join(path.dirname(options.index), href));
        }
      } catch (err) {
        return callback(err);
      }

      var loaded = pending.wrap('load', href, function(err) {
        if (!context) {
          // We've been disposed, but there was something on the setImmediate list,
          // silently ignore
          return;
        }
        if (err) {
          return callback(err);
        }

        exec.exec(function() {
          script.runInContext(context);

          callback();
        }, callback);
      });

      var script = scriptCache[href];
      if (!script) {
        fs.readFile(href, function(err, src) {
          if (!context) {
            // Another disposed race condition. NOP
            return;
          }

          if (err) {
            return loaded(err);
          }

          try {
            script = Contextify.createScript(src.toString(), href);
          } catch (err) {
            return loaded(err);
          }

          if (options.cacheResources) {
            scriptCache[href] = script;
          }

          // Pop off the stack here so any code that might cause an Error.stack
          // retain doesn't retain on the fs buffers, etc. This is a horrible reason
          // to do this but it does help isolate the host and client code.
          setImmediate(loaded);
        });
      } else {
        setImmediate(loaded);
      }
    }
  };

  window.FruitLoops = FruitLoops;

  ClientScripts.forEach(function(script) {
    script.runInContext(context);
  });

  var location = dom.location(window, protocol + '//' + host + options.path);

  var toReset = [
    dom.performance(window),
    dom.storage(window, 'localStorage'),
    dom.storage(window, 'sessionStorage'),
  ];
  var toCleanup = toReset.concat([
    dom.async(window, exec),
    dom.console(window, exec),
    dom.dynamic(window, options),
    dom.history(window),
    dom.navigator(window, options),
    locationPreInit,
    location
  ]);

  function emit() {
    if (!callback) {
      // A pending emit that has already completed
      return;
    }

    $.$('script').remove();

    // Emit error if any of these fail.
    try {
      emitCallbacks.forEach(function(callback) {
        callback();
      });
    } catch (err) {
      return _callback(exec.processError(err));
    }

    // Inline any script content that we may have received
    // We are using text here for two reasons. The first is that it ensures that content like
    // </script> doesn't create multiple elements and the second is that it removes parser overhead
    // when constructing the cheerio object due to the parser iterating ove the JSON content itself.
    var serverCache = $.$('<script></script>');
    serverCache.text('var $serverCache = ' + $.ajax.toJSON() + ';');
    $.$('body').append(serverCache);

    // Ensure sure that we have all of our script content and that it it at the end of the document
    // this has two benefits: the body element may be rendered to directly and this will push
    // all of the scripts after the content elements
    $.$('body').append(scripts);

    options.finalize && options.finalize(page);

    // And output the thing
    _callback(undefined, $.root.html());
  }

  function _callback(err, data) {
    if (!callback) {
      // This should be considered a framework error as the pending tracker
      // should prevent this from happening.
      var hint = err ? (err.stack || err.toString()) : data.toString().substr(0, 100);
      throw new Error('Emit outside of request: ' + _id + ' ' + hint);
    }

    var minimumCache,
        incompleteTasks = pending.pending(),
        taskLog = pending.log(),
        maxTasks = pending.maxPending();
    if ($) {
      minimumCache = $.ajax.minimumCache();
    }

    // Kill off anything that may be pending as well as all logs, etc
    pending.reset();
    if ($ && $.ajax) {
      $.ajax.reset();
    }

    // Invalidate our callback so if there is a bug and future callback attempts occur we will
    // fail using the check above.
    var _callback = callback;
    callback = undefined;

    _callback(err, data, {
      status: status,
      cache: minimumCache,
      pageId: _id,
      pageCount: pageCount,

      taskLog: taskLog,
      incompleteTasks: incompleteTasks,
      maxTasks: maxTasks
    });

    status = 200;
  }

  function loadPage(src) {
    $ = page.$ = jQuery(window, src, exec, options);
    toCleanup.push($);

    pending.push('beforeExec', 1);
    if (options.beforeExec) {
      setImmediate(function() {
        options.beforeExec(page, loadScripts);
      });
    } else {
      loadScripts();
    }
  }
  function loadScripts(err) {
    if (err) {
      return _callback(err);
    }

    pending.pop('beforeExec', 1);

    scripts = $.$('script');

    var loaders = _.map(scripts, function(script, i) {
      return pending.wrap('script', i, function(callback) {

        var el = $.$(script),
            text = el.text(),
            external = el.attr('src');

        if (external) {
          FruitLoops.loadInContext(external, callback);
        } else {
          page.runScript(text, callback);
        }
      });
    });

    async.series(loaders, function(err) {
      if (err) {
        if (err._redirect) {
          return;
        }

        _callback(err);
      } else {
        try {
          options.loaded && options.loaded(page);
        } catch (err) {
          if (err._redirect) {
            return;
          } else {
            _callback(err);
          }
        }
      }
    });
  }

  var page = new Page();
  _.extend(page, {
    id: _id,
    window: window,
    $: $,
    exec: _.bind(exec.exec, exec),
    runScript: function(text, callback) {
      exec.exec(function() {
        try {
          context.run(text, text);
        } catch (err) {
          var stack = err.stack,
              toThrow = /SyntaxError/.test(stack) ? new SyntaxError(err.message) : new Error(err.message);
          toThrow.stack = stack.split(/\n/)[0] + '\n\nInline Script:\n\t<script>' + text + '</script>';
          toThrow._redirect = err._redirect;
          throw toThrow;
        }

        callback();
      }, callback);
    },

    emit: FruitLoops.emit,
    pending: pending,

    metadata: options.metadata,

    dispose: function() {
      // Reset anything pending should we happen to be disposed of outside of an emit response
      pending.reset();
      if ($ && $.ajax) {
        $.ajax.reset();
      }

      _.each(toCleanup, function(toCleanup) {
        toCleanup.dispose();
      });

      emitCallbacks.length = 0;

      options = callback =
          window = context =
          toReset = toCleanup = location = $ =
          window.FruitLoops =
          emitCallbacks = scripts =
          page.metadata = page.window = page.emit = page.$ = undefined;
    },

    navigate: function(path, metadata, _callback) {
      requestId++;
      pageCount++;
      FruitLoops.start = process.hrtime();

      callback = _callback || metadata;
      page.metadata = _callback ? metadata : undefined;

      _.each(toReset, function(toReset) {
        toReset.reset();
      });

      location.reset(protocol + '//' + host + path);
    }
  });

  if (pageCache[options.index]) {
    loadPage(pageCache[options.index]);
  } else {
    fs.readFile(options.index, function(err, src) {
      if (err) {
        return _callback(err);
      }

      // Buffer -> String
      src = src.toString();

      if (options.cacheResources) {
        pageCache[options.index] = src;
      }

      loadPage(src);
    });
  }

  return page;
};


function Window() {
}

function Page() {
}
