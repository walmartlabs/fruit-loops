var ajax = require('./ajax'),
    Cheerio = require('cheerio'),
    detect = require('./detect'),
    url = require('url');

require('./cheerio-shim');

// TODO : For testing run the zepto tests (that apply) against the output
module.exports = exports = function(window, html) {
  var root = Cheerio.load(html);

  function $(selector, context) {
    // Special case the document and window instances
    if (context && (context.createElement || context.self === context)) {
      context = undefined;
    }

    return root(selector, context);
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
