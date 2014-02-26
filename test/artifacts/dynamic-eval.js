var evalThrow;

try {
  var _savedWindow = window;
  eval('window.evalString="evaled! " + ((_savedWindow === this) && (this === window) && (this === window.self));window.fs = require("fs");');
} catch (err) {
  evalThrow = err;
}
