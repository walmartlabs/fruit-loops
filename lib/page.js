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
  var start = process.hrtime(),

      ajaxCache = options.ajaxCache,
      host = options.host || 'localhost',
      protocol = options.protocol || 'http:',
      callback = options.callback,
      emitCallbacks = [],
      scripts,

      exec = Exec.create(_callback),
      pending = exec.pending,
      context = Contextify.createContext({}),
      window = context.getGlobal(),
      _id = windowId++,
      requestId = 0,
      $;

  _.extend(window, {
    _id: _id,
    _start: start,
    $serverSide: true,

    toString: function() {
      // Won't impact Object.prototype.toString but helps us out a bit
      return '[object Window]';
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
      if (options.resolver) {
        href = options.resolver(href, page);
      } else {
        href = path.resolve(path.join(path.dirname(options.index), href));
      }

      var loaded = pending.wrap('load', href, function() {
        exec.exec(function() {
          script.runInContext(context);

          callback();
        }, callback);
      });

      var script = scriptCache[href];
      if (!script) {
        fs.readFile(href, function(err, src) {
          if (err) {
            return callback(err);
          }

          script = Contextify.createScript(src.toString(), href);
          if (options.cacheResources) {
            scriptCache[href] = script;
          }

          loaded();
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
  dom.location(window, protocol + '//' + host + options.path, redirect);
  dom.history(window);
  dom.navigator(window, options);
  dom.performance(window);
  dom.storage(window, 'localStorage');
  dom.storage(window, 'sessionStorage');

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
    $.$('body').append('\n<script>var $serverCache = ' + $.ajax.toJSON() + ';</script>');

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

    _callback(err, data, {cache: minimumCache});
  }

  function loadPage(src) {
    $ = page.$ = jQuery(window, src, exec, ajaxCache);

    pending.push('beforeExec', 1);
    if (options.beforeExec) {
      options.beforeExec(page, loadScripts);
    } else {
      loadScripts();
    }
  }
  function loadScripts() {
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
            context.run(text, text);

            callback();
          }, callback);
        }
      });
    });

    async.series(loaders, function(err) {
      if (err) {
        _callback(err);
      } else {
        options.loaded && options.loaded(page);
      }
    });
  }

  var page = {
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

      window = context = undefined;
    },

    navigate: function(path, _callback) {
      requestId++;
      window._start = start = process.hrtime();
      callback = _callback;
      dom.location(window, protocol + '//' + host + path, redirect);
      dom.performance(window);
      dom.storage(window, 'localStorage');
      dom.storage(window, 'sessionStorage');
    }
  };

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
