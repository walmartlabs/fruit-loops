var _ = require('lodash');

module.exports = function Console(window, exec) {
  window.console = {
    log: delegate('log'),
    info: delegate('info'),
    error: delegate('error'),
    warn: delegate('warn'),

    time: delegate('time'),
    timeEnd: delegate('timeEnd')
  };

  function delegate( name) {
    return function() {
      console[name].apply(console, ['id_' + window.FruitLoops.id, process.hrtime(window.FruitLoops.start)[1]/1e6].concat(mapArgs(arguments)));
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

  return {
    dispose: function() {
      window = window.console = undefined;
    }
  };
};
