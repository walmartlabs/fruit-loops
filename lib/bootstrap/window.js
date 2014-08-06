/*global FruitLoops, document */
var window = this,
    self = this;
window.document = {
  defaultView: window
};

window.$serverSide = true;
window.toString = function() {
  // Won't impact Object.prototype.toString but helps us out a bit
  return '[object Window]';
};

// FruitLoops object proxies
// WARN: These are deprecated and will likely be removed before the 1.0 release.
window.emit = function(after) {
  return FruitLoops.emit(after);
};
window.onEmit = function(callback) {
  return FruitLoops.onEmit(callback);
};
window.loadInContext = function(href, callback) {
  return FruitLoops.loadInContext(href, callback);
};
