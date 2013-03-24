var _ = require('underscore'),
    Cheerio = require('cheerio');

var $make = Cheerio.prototype.make;

Cheerio.prototype.make = function(dom, context) {
  var ret = $make.call(this, dom, context);

  ret.__defineGetter__('innerHTML', function() {
    return this.html();
  });
  ret.__defineSetter__('innerHTML', function(html) {
    this.html(html || '');
  });

  return ret;
};

Cheerio.prototype.bind = Cheerio.prototype.unbind =
Cheerio.prototype.on = Cheerio.prototype.off =
Cheerio.prototype.delegate = function() {
  return this;
};

Cheerio.prototype.get = Cheerio.prototype.eq;
Cheerio.prototype.forEach = function(callback, scope) {
  var elements = this;
  elements.each(function(index) {
    callback.call(scope || elements, this, index);
  });
};

Cheerio.prototype.getAttribute = function(name) {
  return this.attr(name);
};

Cheerio.prototype.val = function(value) {
  // TODO : Special case for non-text inputs
  return this.attr('value', value);
};

Cheerio.prototype.css = function(name, value) {
  /*jshint eqnull: true */
  var styles = {};
  (this.attr('style') || '').split(/\s*;\s*/g).forEach(function(style) {
    var components = style.split(':');
    if (!components[0]) {
      return;
    }

    styles[components[0]] = (components[1] || '').replace(/;\s*$/, '');
  });

  if (value != null) {
    styles[name] = value;

    this.attr('style', _.map(styles, function(value, key) { return value ? (key + ':' + value + ';') : ''; }).join(''));
  } else {
    return styles[name];
  }
};
Cheerio.prototype.toggle = function(toggle) {
  if (toggle === undefined) {
    toggle = this.css('display') !== 'none';
  }

  this[toggle ? 'show' : 'hide']();
  return this;
};
Cheerio.prototype.show = function() {
  this.css('display', '');
  return this;
};
Cheerio.prototype.hide = function() {
  this.css('display', 'none');
  return this;
};
Cheerio.prototype.toggleClass = function(className, toggle) {
  if (toggle === undefined) {
    toggle = !this.hasClass(className);
  }
  if (toggle) {
    this.addClass(className);
  } else {
    this.removeClass(className);
  }
  return this;
};

Cheerio.prototype.focus = function() {
  this.attr('autofocus', 'autofocus');
};

Cheerio.prototype.ready = function(callback) {
  callback();
};
