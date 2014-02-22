var fnThrow;

try {
  var _savedWindow = this;
  var fn = new Function('window.fnString="fned! " + ((_savedWindow === this) && (this === window) && (this === window.self));window.fs = require("fs");');
  fn();
} catch (err) {
  fnThrow = err;
}
