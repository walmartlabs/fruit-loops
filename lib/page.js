var dom = require('./dom'),
    exec = require('./exec'),
    rewriteStack = require('./exec').rewriteStack,
    fs = require('fs'),
    jQuery = require('./jquery'),
    path = require('path'),
    vm = require('vm');

module.exports = exports = function(options) {
  var host = options.host || 'localhost',
      callback = options.callback;

  function execUser(userMethod) {
    try {
      exec.exec(userMethod);
    } catch (err) {
      if (!callback) {
        throw err;
      }
      callback(err);
    }
  }

  var window = vm.createContext({
    $server: true,
    nextTick: function(callback) {
      process.nextTick(function() { execUser(callback); });
    },

    loadInContext: function(href, callback) {
      if (href && window.lumbarLoadPrefix) {
        // TODO : Make this more generic (i.e. don't expect a sha in there)
        href = path.relative(path.dirname(window.lumbarLoadPrefix), href);
        href = path.resolve(path.dirname(options.index) + '/web', href);
      }

      execUser(function() {
        vm.runInContext(fs.readFileSync(href), window, href);
      });

      // TODO : Make this generic, i.e. allow names other than `Phoenix`
      if (window.Phoenix && !changeRegistered) {
        changeRegistered = true;
        window.Phoenix.on('emit', function() {
          setTimeout(function() {
            emit();
          }, 10);
        });
      }

      if (callback) {
        window.nextTick(callback);
      }
    }
  });
  window.self = window.window = window;

  dom.console(window);
  dom.document(window);
  dom.location(window, 'http://' + host + options.url.path);
  dom.history(window);
  dom.navigator(window, options);
  dom.performance(window);
  dom.storage(window, 'localStorage');
  dom.storage(window, 'sessionStorage');

  var $ = jQuery(window, fs.readFileSync(options.index));
  window.jQuery = window.Zepto = window.$ = $.$;

  var changeRegistered,
      viewSet = false;

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
    $.$('body').append(files);

    console.log('emit time: ' + (Date.now() - window.performance.timing.navigationStart));
    // And output the thing
    callback(undefined, $.root.html());
    callback = undefined;
  }

  var files = $.$('script');
  files.each(function() {
    var el = $.$(this),
        text = el.text(),
        external = el.attr('src');

    if (external) {
      window.loadInContext(external.replace(/\.js$/, '-server.js'));
    } else {
      execUser(function() {
        vm.runInContext(text, window, text);
      });
    }
  });

  return {
    window: window,
    emit: emit
  };
};
