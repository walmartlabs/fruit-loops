module.exports = function Navigator(window, options) {
  window.navigator = {
    userAgent: options.userAgent || ''
  };
};
