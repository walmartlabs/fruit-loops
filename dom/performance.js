module.exports = function(window) {
  window.performance = {
    timing: {
      navigationStart: Date.now()
    }
  };
};
