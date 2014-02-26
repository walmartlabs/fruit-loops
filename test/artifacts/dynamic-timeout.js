try {
  setTimeout('try{'
      + 'window.timeoutString="timeouted! " + ((_savedWindow === this) && (this === window) && (this === window.self));'
      + 'window.fs = require("fs");'
    + '} catch (err) { window.timeoutThrow = err; }', 0);
} catch (err) {
  window.timeoutInitThrow = err;
}
