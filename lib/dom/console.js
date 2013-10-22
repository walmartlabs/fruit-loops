var _ = require('underscore'),
    rewriteStack = require('../exec').rewriteStack;

module.exports = function(window) {
  window.console = {
    log: delegate('log'),
    info: delegate('info'),
    error: delegate('error'),
    warn: delegate('warn')
  };
};

function delegate(name) {
  return function() {
    console[name].apply(console, mapArgs(arguments));
  };
}

function mapArgs(args) {
  return _.map(args, function(arg) {
    if (arg && arg.split) {
      arg = rewriteStack(arg);
    }
    return arg;
  });
}
