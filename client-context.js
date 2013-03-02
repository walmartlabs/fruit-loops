var dom = require('./dom'),
    exec = require('./client-exec').exec,
    fs = require('fs'),
    jQuery = require('./fruit-loops'),
    path = require('path'),
    vm = require('vm');

module.exports = exports = function(index, callback) {
  var window = vm.createContext({
    $server: true,
    nextTick: function(callback) {
      process.nextTick(function() { exec(callback); });
    },

    navigator: {
      userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7'
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
        href = path.relative(window.lumbarLoadPrefix, href);
        href = path.resolve(path.dirname(index) + '/web', href);
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
  dom.location(window, 'http://localhost:8080/home/register/1234');

  var $ = jQuery(window, fs.readFileSync(index));
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
    $.$('script').eq(0).before('<script>var $serverCache = ' + $.ajax.toJSON() + ';</script>');

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
      window.loadInContext(external);
    } else {
      exec(function() {
        vm.runInContext(text, window, text);
      });
    }
  });
};
