var ajax = require('./ajax'),
    Cheerio = require('cheerio'),
    detect = require('./detect'),
    url = require('url');

require('./cheerio-shim');

// TODO : For testing run the zepto tests (that apply) against the output
module.exports = exports = function(window, html) {
  var root = Cheerio.load(html);
  html = undefined;

  var htmlEl,
      headEl,
      bodyEl;

  (function findWellKnown(el) {
    var children = el.children,
        i = children.length;
    while (i--) {
      var name = children[i].name;

      if (name === 'html') {
        htmlEl = root(children[i]);
        findWellKnown(children[i]);
      } else if (name === 'head') {
        headEl = root(children[i]);
      } else if (name === 'body') {
        bodyEl = root(children[i]);
      }
    }
  })(root._root);

  function $(selector, context) {
    // Special case the document and window instances
    if (selector && (
          selector === 'document'
          || selector.createElement
          || selector.self === selector)) {
      var $ = root();
      $.ready = function(callback) {
        window.nextTick(callback);
      };
      return $;
    }
    if (context && (context.createElement || context.self === context)) {
      context = undefined;
    }

    if (selector === 'html' || selector === ':root') {
      return htmlEl || root([]);
    } else if (selector === 'body') {
      return bodyEl || root([]);
    } else if (selector === 'head') {
      return headEl || root([]);
    } else {
      return root(selector, context);
    }
  }

  $.trim = function(str) { return str.trim(); };
  $.param = function(params) {
    return url.format({query: params}).substring(1);
  };

  detect($, window);

  $.fn = Cheerio.prototype;

  return {
    $: $,
    root: root,
    ajax: ajax($)
  };
};
