var _ = require('lodash'),
    async = require('async'),
    Contextify = require('contextify'),
    dom = require('./dom'),
    exec = require('./exec'),
      rewriteStack = exec.rewriteStack,
    fs = require('fs'),
    jQuery = require('./jquery'),
    path = require('path');

var pageCache = {},
    scriptCache = {},
    windowId = 0;

module.exports = exports = function(options) {
  var host = options.host || 'localhost',
      protocol = options.protocol || 'http:',
      callback = options.callback,
      emitCallbacks = [];

  function execUser(userMethod) {
    try {
      exec.exec(userMethod);
    } catch (err) {
      callback(err);
    }
  }

  function redirect(url) {
    callback(undefined, {redirect: url});
    callback = undefined;
  }

  var start = process.hrtime();

  var $,
      scripts,
      cacheScript,
      pending = exec.Pending.create();

  var context = Contextify.createContext({}),
      window = context.getGlobal();
  _.extend(window, {
    _id: windowId++,
    $serverSide: true,

    toString: function() {
      // Won't impact Object.prototype.toString but helps us out a bit
      return '[object Window]';
    },

    emit: function(after) {
      function callback() {
        if (isComplete()) {
          setImmediate(emit);
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

      if (isComplete()) {
        setImmediate(emit);
      } else if (after === 'ajax') {
        $.ajax.once('complete', callback);
      } else if (after === 'events') {
        pending.on('pop', callback);
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

      function exec() {
        execUser(function() {
          script.runInContext(context);
        });

        if (callback) {
          execUser(callback);
        }
      }

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

          exec();
        });
      } else {
        setImmediate(exec);
      }
    }
  });
  window.self = window.window = window;

  dom.async(window, pending, execUser);
  dom.console(window);
  dom.document(window);
  dom.location(window, protocol + '//' + host + options.path, redirect);
  dom.history(window);
  dom.navigator(window, options);
  dom.performance(window);
  dom.storage(window, 'localStorage');
  dom.storage(window, 'sessionStorage');

  function emit() {
    var _callback = callback;

    if (!callback) {
      // This should be considered a framework error as the pending tracker
      // should prevent this from happening.
      throw new Error('Emit outside of request: ' + window._id);
    }

    $.$('script').remove();

    emitCallbacks.forEach(function(callback) {
      execUser(callback);
    });

    // Inline any script content that we may have received
    $.$('body').append('<script>var $serverCache = ' + $.ajax.toJSON() + ';</script>');

    // Kill off anything that may be pending as well as all logs, etc
    pending.reset();
    $.ajax.reset();

    // Ensure sure that we have all of our script content and that it it at the end of the document
    // this has two benefits: the body element may be rendered to directly and this will push
    // all of the scripts after the content elements
    $.$('body').append(scripts);

    options.finalize && options.finalize(page);

    console.log('emit time: ' + process.hrtime(start)[1]/1e6, 'id_' + window._id);

    // And output the thing
    callback = undefined;
    _callback(undefined, $.root.html());
  }


  function loadPage(src) {
    $ = page.$ = jQuery(window, src, pending);

    if (options.beforeExec) {
      options.beforeExec(page, loadScripts);
    } else {
      loadScripts();
    }
  }

  function loadScripts() {
    scripts = $.$('script');
    async.forEachSeries(scripts, function(script, callback) {
      var el = $.$(script),
          text = el.text(),
          external = el.attr('src');

      if (external) {
        window.loadInContext(external, callback);
      } else {
        execUser(function() {
          context.run(text, text);
        });
        callback();
      }
    },
    function(err) {
      if (err) {
        callback(err);
      } else {
        options.loaded && options.loaded(page);
      }
    });
  }

  var page = {
    id: window._id,
    window: window,
    $: $,
    exec: execUser,
    emit: window.emit,

    dispose: function() {
      // Handle API differences in contextify
      context.dispose();
    },

    navigate: function(path, _callback) {
      start = process.hrtime();
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
        return callback(err);
      }

      if (options.cacheResources) {
        pageCache[options.index] = src;
      }

      loadPage(src);
    });
  }

  return page;
};
