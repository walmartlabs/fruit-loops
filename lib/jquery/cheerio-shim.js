var _ = require('lodash'),
    Cheerio = require('cheerio');

Cheerio.prototype.appendTo = function(relative) {
  if (!relative.cheerio) {
    relative = this._$(relative);
  }
  relative.append(this);
  return this;
};
Cheerio.prototype.insertAfter = function(relative) {
  if (!relative.cheerio) {
    relative = this._$(relative);
  }
  relative.after(this);
  return this;
};
Cheerio.prototype.insertBefore = function(relative) {
  if (!relative.cheerio) {
    relative = this._$(relative);
  }
  relative.before(this);
  return this;
};
Cheerio.prototype.prependTo = function(relative) {
  if (!relative.cheerio) {
    relative = this._$(relative);
  }
  relative.prepend(this);
  return this;
};
Cheerio.prototype.replaceAll = function(relative) {
  if (!relative.cheerio) {
    relative = this._$(relative);
  }
  relative.replaceWith(this);
  return this;
};

Cheerio.prototype.bind = Cheerio.prototype.unbind =
Cheerio.prototype.on = Cheerio.prototype.off =
Cheerio.prototype.live = Cheerio.prototype.die =
Cheerio.prototype.delegate = Cheerio.prototype.undelegate =
Cheerio.prototype.one = function() {
  return this;
};

Cheerio.prototype.forEach = function(callback, scope) {
  var elements = this;
  elements.each(function(index) {
    callback.call(scope || elements, this, index);
  });
  return this;
};

Cheerio.prototype.detach = Cheerio.prototype.remove;

Cheerio.prototype.toggle = function(toggle) {
  if (toggle === undefined) {
    toggle = this.css('display') === 'none';
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
Cheerio.prototype.focus = function() {
  this.attr('autofocus', 'autofocus');
  return this;
};
Cheerio.prototype.blur = function() {
  this.removeAttr('autofocus');
  return this;
};

Cheerio.prototype.animate = function(properties) {
  this.css(properties);

  var callback = arguments[arguments.length-1];
  if (callback && callback.callback) {
    callback = callback.callback;
  }

  if (callback.call) {
    var el = this;
    setImmediate(function() {
      callback.call(el);
    });
  }

  return this;
};

