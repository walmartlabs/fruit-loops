var _ = require('lodash');

module.exports = function(window, exec) {
  window.console = {
    log: delegate(window, 'log'),
    info: delegate(window, 'info'),
    error: delegate(window, 'error'),
    warn: delegate(window, 'warn'),

    time: delegate(window, 'time'),
    timeEnd: delegate(window, 'timeEnd')
  };

  function delegate(window, name) {
    return function() {
      console[name].apply(console, mapArgs(arguments).concat(['id_' + window._id]));
    };
  }

  function mapArgs(args) {
    return _.map(args, function(arg) {
      if (arg && arg.split) {
        arg = exec.rewriteStack(arg);
      }
      return arg;
    });
  }
};
