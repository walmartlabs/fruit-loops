var dom = require('./dom'),
    exec = require('./client-exec').exec,
    fs = require('fs'),
    jQuery = require('./fruit-loops'),
    path = require('path'),
    vm = require('vm');

module.exports = exports = function(options) {
  var host = options.host || 'localhost',
      callback = options.callback;

  var window = vm.createContext({
    $server: true,
    nextTick: function(callback) {
      process.nextTick(function() { exec(callback); });
    },

    navigator: {
      userAgent: options.userAgent
    },

    sessionStorage: {
      getItem: function() {
      }
    },
    localStorage: {
      getItem: function() {
      }
    },

    loadInContext: function(href, callback) {
      if (href && window.lumbarLoadPrefix) {
        // TODO : Make this more generic (i.e. don't expect a sha in there)
        href = path.relative(path.dirname(window.lumbarLoadPrefix), href);
        href = path.resolve(path.dirname(options.index) + '/web', href);
      }

      exec(function() {
        vm.runInContext(fs.readFileSync(href), window, href);
      });

      // TODO : Make this generic, i.e. allow names other than `Phoenix`
      if (window.Phoenix && !changeRegistered) {
        changeRegistered = true;
        window.Phoenix.on('change:view:end', function() {
          viewSet = true;
          emit();
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

  var $ = jQuery(window, fs.readFileSync(options.index));
  window.jQuery = window.Zepto = window.$ = $.$;

  var changeRegistered,
      viewSet = false;

  function emit() {
    // TODO : Detect the error page and handle appropriately
    // TODO : Reconsider the loading flag for the loading state (vs. active ajax).
    //      If we do that then we will need to provide an opt out mechanism.
    if (!viewSet || !$.ajax.allComplete()) {
      // Operations are still pending, don't push anything out just yet
      return;
    }

    // Inline any script content that we may have received
    $.$('body').append('<script>var $serverCache = ' + $.ajax.toJSON() + ';</script>');

    // Ensure sure that we have all of our script content and that it it at the end of the document
    // this has two benefits: the body element may be rendered to directly and this will push
    // all of the scripts after the content elements
    $.$('body').append(files);

    // And output the thing
    callback(undefined, $.root.html());
  }
  $.ajax.on('complete', emit);

  var files = $.$('script');
  files.each(function() {
    var el = $.$(this),
        text = el.text(),
        external = el.attr('src');

    if (external) {
      window.loadInContext(external.replace(/\.js$/, '-server.js'));
    } else {
      exec(function() {
        vm.runInContext(text, window, text);
      });
    }
  });
};
