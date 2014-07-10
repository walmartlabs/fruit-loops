module.exports = function Navigator(window, options) {
  window.navigator = {
    userAgent: options.userAgent || ''
  };

  return {
    dispose: function() {
      window = window.navigator = undefined;
    }
  };
};
