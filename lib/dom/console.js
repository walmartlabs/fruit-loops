var _ = require('lodash');

module.exports = function Console(window, exec) {
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
      console[name].apply(console, ['id_' + window._id, process.hrtime(window._start)[1]/1e6].concat(mapArgs(arguments)));
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
