module.exports = function(window, options) {
  window.navigator = {
    userAgent: options.userAgent || ''
  };
};
