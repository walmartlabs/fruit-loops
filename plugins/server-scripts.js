var _ = require('underscore');

module.exports = {
  mode: 'scripts',
  priority: 98,   // Just below the core scripts plugin....

  fileFilter: function(context, next) {
    return /\.(js|json)$/;
  },

  moduleResources: function(context, next, complete) {
    var module = context.module;

    var files = [];
    (module.server || module.scripts).forEach(function(script) {
      if (!_.has(script, 'server') || script.server) {
        files.push(script);
      }
    });

    complete(undefined, files);
  }
};
