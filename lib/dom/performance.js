module.exports = function Performance(window) {
  window.performance = {
    timing: {
      navigationStart: Date.now(),
      domLoading: Date.now()
    }
  };
};
