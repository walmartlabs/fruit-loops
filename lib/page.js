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

module.exports = exports = function(options) {
  // We need to set this up here to ensure that the defineProperty propagates properly to the
  // context
  // https://github.com/joyent/node/commit/3c5ea410ca56da3d4785e2563cb2724364669fd2
  var baseContext = new Window(windowId++);
  dom.location.preInit(baseContext);

  var ajaxCache = options.ajaxCache,
      host = options.host || 'localhost',
      protocol = options.protocol || 'http:',
      callback = options.callback,
      emitCallbacks = [],
      scripts,

      exec = Exec.create(_callback),
      pending = exec.pending,
      context = Contextify.createContext(baseContext),
      window = context.getGlobal(),
      _id = baseContext._id,
      requestId = 0,
      pageCount = 1,      // Number of times this page has navigated
      $;

  _.extend(window, {
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

      if (isComplete()) {
        checkComplete();
      } else if (after === 'ajax') {
        $.ajax.once('complete', checkComplete);
      } else if (after === 'events') {
        pending.on('pop', checkComplete);
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

      var loaded = pending.wrap('load', href, function() {
        if (!context) {
          // We've been disposed, but there was something on the setImmediate list,
          // silently ignore
          return;
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
            return callback(err);
          }

          try {
            script = Contextify.createScript(src.toString(), href);
          } catch (err) {
            return callback(err);
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
  });
  window.self = window.window = window;

  dom.async(window, exec);
  dom.console(window, exec);
  dom.dynamic(window, options);
  dom.document(window);
  dom.history(window, redirect);
  dom.navigator(window, options);
  dom.performance(window);
  dom.storage(window, 'localStorage');
  dom.storage(window, 'sessionStorage');

  var location = dom.location(window, protocol + '//' + host + options.path, redirect);

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
    $.$('body').append('<script>var $serverCache = ' + $.ajax.toJSON() + ';</script>');

    // Ensure sure that we have all of our script content and that it it at the end of the document
    // this has two benefits: the body element may be rendered to directly and this will push
    // all of the scripts after the content elements
    $.$('body').append(scripts);

    options.finalize && options.finalize(page);

    // And output the thing
    _callback(undefined, $.root.html());
  }

  function redirect(url) {
    _callback(undefined, {redirect: url});

    // Cancel futher exec
    throw new exec.RedirectError(url);
  }

  function _callback(err, data) {
    if (!callback) {
      // This should be considered a framework error as the pending tracker
      // should prevent this from happening.
      var hint = err ? (err.stack || err.toString()) : data.toString().substr(0, 100);
      throw new Error('Emit outside of request: ' + _id + ' ' + hint);
    }

    var minimumCache = $ && $.ajax.minimumCache();

    // Kill off anything that may be pending as well as all logs, etc
    pending.reset();
    if ($ && $.ajax) {
      $.ajax.reset();
    }

    // Invalidate our callback so if there is a bug and future callback attempts occur we will
    // fail using the check above.
    var _callback = callback;
    callback = undefined;

    _callback(err, data, {cache: minimumCache, pageId: _id, pageCount: pageCount});
  }

  function loadPage(src) {
    $ = page.$ = jQuery(window, src, exec, ajaxCache);

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
          window.loadInContext(external, callback);
        } else {
          exec.exec(function() {
            try {
              context.run(text, text);
            } catch (err) {
              var stack = err.stack,
                  toThrow = /SyntaxError/.test(stack) ? new SyntaxError(err.message) : new Error(err.message);
              toThrow.stack = stack.split(/\n/)[0] + '\n\nInline Script:\n\t<script>' + text + '</script>';
              throw toThrow;
            }

            callback();
          }, callback);
        }
      });
    });

    async.series(loaders, function(err) {
      if (err instanceof exec.RedirectError) {
        return;
      }

      if (err) {
        _callback(err);
      } else {
        try {
          options.loaded && options.loaded(page);
        } catch (err) {
          if (err instanceof exec.RedirectError) {
            return;
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
    emit: window.emit,
    pending: pending,

    dispose: function() {
      // Reset anything pending should we happen to be disposed of outside of an emit response
      pending.reset();
      if ($ && $.ajax) {
        $.ajax.reset();
      }

      location.dispose();

      options = callback =
          window = baseContext = context = location = $ =
          emitCallbacks = scripts =
          page.window = page.emit = page.$ = undefined;
    },

    navigate: function(path, _callback) {
      requestId++;
      pageCount++;
      window._start = process.hrtime();
      callback = _callback;
      dom.performance(window);
      dom.storage(window, 'localStorage');
      dom.storage(window, 'sessionStorage');

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


function Window(id) {
  this._id = id;
  this._start = process.hrtime();
}

Window.prototype.$serverSide = true;
Window.prototype.toString = function() {
  // Won't impact Object.prototype.toString but helps us out a bit
  return '[object Window]';
};

function Page() {
}
