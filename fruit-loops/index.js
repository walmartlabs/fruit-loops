var ajax = require('./ajax'),
    Cheerio = require('cheerio'),
    detect = require('./detect');

require('./cheerio-shim');

// TODO : For testing run the zepto tests (that apply) against the output
module.exports = exports = function(window, html) {
  var root = Cheerio.load(html);

  function $(selector, context) {
    // Special case the document instance
    if (selector && selector.createElement) {
      selector = root;
    }
    if (context && context.createElement) {
      context = root;
    }

    return root(selector, context);
  }

  $.trim = function(str) { str.trim(); };

  detect($, window);

  $.fn = Cheerio.prototype;

  return {
    $: $,
    root: root,
    ajax: ajax($)
  };
};
