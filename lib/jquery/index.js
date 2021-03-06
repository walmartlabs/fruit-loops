var _ = require('lodash'),
    ajax = require('./ajax'),
    Cheerio = require('cheerio'),
    detect = require('./detect'),
    url = require('url');

require('./cheerio-shim');

module.exports = exports = function jQuery(window, html, exec, options) {
  var root = Cheerio.load(html);
  root._$ = $;
  html = undefined;

  function query(selector, context) {
    /* jshint -W103 */
    var ret = root(selector, context);
    ret._$ = $;

    // We need to remap ourselves to the private context and unfortunately
    // the return behavior of the Cheerio constructo makes this difficult to
    // implement without ramapping after the fact.
    ret.__proto__ = $.fn;
    return ret;
  }

  var htmlEl,
      headEl,
      bodyEl;

  function $(selector, context) {
    if (typeof selector === 'function') {
      window.nextTick(selector);
      return $;
    }

    // Fast track cheerio instances
    if (selector && selector.cheerio) {
      return selector;
    }

    // Special case the document and window instances
    if (selector && (
          selector === 'document'
          || isDocument(selector)
          || isWindow(selector))) {
      var $ = query();
      $.ready = function(callback) {
        window.nextTick(callback);
      };
      return $;
    }
    if (context && (isDocument(context) || isWindow(context))) {
      context = undefined;
    }

    // Cache well known instances once they have been requested
    if (selector === 'html' || selector === ':root') {
      htmlEl = htmlEl || query(selector, context);
      return htmlEl;
    } else if (selector === 'body') {
      bodyEl = bodyEl || query(selector, context);
      return bodyEl;
    } else if (selector === 'head') {
      headEl = headEl || query(selector, context);
      return headEl;
    } else {
      return query(selector, context);
    }
  }

  $.fn = new Cheerio();

  // Expose instance fn fields to derived $ instances (such as from $().find)
  $.fn._make = function(dom) {
    /* jshint -W103 */
    var ret = Cheerio.prototype._make.call(this, dom);
    ret.__proto__ = $.fn;
    return ret;
  };

  $.each = function(elements, callback) {
    _.every(elements, function(el, i) {
      return callback.call(el, i, el) !== false;
    });
    return elements;
  };
  $.extend = function(deep) {
    if (deep === true) {
      return _.merge.apply(_, _.rest(arguments, 1));
    } else {
      return _.extend.apply(_, arguments);
    }
  };
  $.globalEval = function(script) {
    /*jshint evil:true,-W024,-W067 */
    // Force global exec
    // http://perfectionkills.com/global-eval-what-are-the-options
    return (1,window.eval)(script);
  };

  $.grep = _.filter;
  $.inArray = function(value, elements, fromIndex) {
    return elements.indexOf(value, fromIndex);
  };

  $.isArray = _.isArray;
  $.isFunction = _.isFunction;
  $.isNumeric = _.isNumber;
  $.isEmptyObject = isEmptyObject;
  $.isPlainObject = isPlainObject;
  $.isWindow = isWindow;
  $.type = type;

  $.makeArray = _.toArray;
  $.map = _.map;
  $.merge = function(first, second) {
    first.splice.apply(first, [first.length, 0].concat(second));
    return first;
  };
  $.noop = _.noop;
  $.now = function() {
    return Date.now();
  };
  $.param = function(params) {
    return url.format({query: params}).substring(1);
  };
  $.trim = function(str) {
    return str.trim();
  };
  $.parseJSON = JSON.parse;
  $.proxy = function(obj, name) {
    if (typeof name === 'string') {
      return _.bindKey.apply(this, arguments);
    } else {
      return _.bind.apply(this, arguments);
    }
  };

  detect($, window);

  window.jQuery = window.Zepto = window.$ = $;

  var ajaxInstance = ajax(window, exec, options && options.ajax);
  return {
    $: $,
    root: root,
    ajax: ajaxInstance,

    dispose: function() {
      ajaxInstance.dispose();

      window = window.jQuery = window.Zepto = window.$ = $.fn = ajaxInstance = root._$ = root = undefined;
    }
  };
};


var objectMatch = /\[object (.*)\]/;
function type(obj) {
  if (obj === null) {
    return 'null';
  }

  var type = typeof obj;
  if (type === 'object') {
    // We can't modify the output of Object toString so first check the instance toString for
    // well known objects
    // Since $ instances will render their html content on toString, we want to also
    // check for a few known fields on the window object.
    if (obj.self === obj && obj.document && obj.toString() === '[object Window]') {
      type = 'window';
    } else if (objectMatch.test(Object.prototype.toString.call(obj))) {
      type = RegExp.$1.toLowerCase();
    }
  }
  return type;
}
function isDocument(obj) {
  return obj.defaultView && isWindow(obj.defaultView) && obj.defaultView.document === obj;
}
function isEmptyObject(obj) {
  if (type(obj) !== 'object') {
    return false;
  }
  for (var name in obj) {
    if (obj.hasOwnProperty(name)) {
      return false;
    }
  }
  return true;
}
function isPlainObject(obj) {
  return type(obj) === 'object'
      && !isDocument(obj)
      && Object.getPrototypeOf(obj) === Object.prototype;
}
function isWindow(obj) {
  return type(obj) === 'window';
}
