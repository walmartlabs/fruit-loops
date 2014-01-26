var async = require('async'),
    dom = require('./dom'),
    exec = require('./exec'),
    rewriteStack = require('./exec').rewriteStack,
    fs = require('fs'),
    jQuery = require('./jquery'),
    path = require('path'),
    vm = require('vm');

var pageCache = {},
    scriptCache = {};

module.exports = exports = function(options) {
  var host = options.host || 'localhost',
      protocol = options.protocol || 'http:',
      callback = options.callback;

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

  var $,
      scripts;
  var window = vm.createContext({
    $serverSide: true,
    nextTick: function(callback) {
      process.nextTick(function() { execUser(callback); });
    },

    emit: function() {
      setTimeout(function() {
        emit();
      }, 10);
    },

    loadInContext: function(href, callback) {
      if (options.resolver) {
        href = options.resolver(href, window);
      } else {
        href = path.resolve(path.join(path.dirname(options.index), href));
      }

      function exec() {
        execUser(function() {
          script.runInContext(window);
        });

        if (callback) {
          window.nextTick(callback);
        }
      }

      var script = scriptCache[href];
      if (!script) {
        fs.readFile(href, function(err, src) {
          if (err) {
            return callback(err);
          }

          script = vm.createScript(src, href);
          if (options.cacheResources) {
            scriptCache[href] = script;
          }

          exec();
        });
      } else {
        process.nextTick(exec);
      }
    }
  });
  window.self = window.window = window;

  dom.console(window);
  dom.document(window);
  dom.location(window, protocol + '//' + host + options.url.path, redirect);
  dom.history(window);
  dom.navigator(window, options);
  dom.performance(window);
  dom.storage(window, 'localStorage');
  dom.storage(window, 'sessionStorage');

  function emit() {
    // TODO : Figure put the best way to handle output after send... Error? Ignore? Log?
    if (!callback) {
      console.log(rewriteStack(new Error().stack));//$.root.html());
      return;
    }

    // Inline any script content that we may have received
    $.$('body').append('<script>var $serverCache = ' + $.ajax.toJSON() + ';</script>');

    // Ensure sure that we have all of our script content and that it it at the end of the document
    // this has two benefits: the body element may be rendered to directly and this will push
    // all of the scripts after the content elements
    $.$('body').append(scripts);

    options.finalize && options.finalize(window);

    console.log('emit time: ' + (Date.now() - window.performance.timing.navigationStart));
    // And output the thing
    callback(undefined, $.root.html());
    callback = undefined;
  }


  function loadPage(err, src) {
    if (err) {
      return callback(err);
    }

    if (options.cacheResources) {
      pageCache[options.index] = src;
    }

    $ = jQuery(window, src);

    if (options.beforeExec) {
      options.beforeExec(window, execUser, loadScripts);
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
          vm.runInContext(text, window, text);
        });
        callback();
      }
    },
    function(err) {
      if (err) {
        callback(err);
      } else {
        options.loaded && options.loaded(err, window);
      }
    });
  }

  if (pageCache[options.index]) {
    loadPage(undefined, pageCache[options.index]);
  } else {
    fs.readFile(options.index, loadPage);
  }

  return {
    window: window,
    emit: emit
  };
};
