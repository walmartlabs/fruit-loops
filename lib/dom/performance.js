module.exports = function Performance(window) {
  window.performance = {
    timing: {
      navigationStart: Date.now(),
      domLoading: Date.now()
    }
  };

  return {
    reset: function() {
      window.performance.timing = {
        navigationStart: Date.now(),
        domLoading: Date.now()
      };
    },
    dispose: function() {
      window = window.performance = undefined;
    }
  };
};
