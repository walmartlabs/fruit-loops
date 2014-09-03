module.exports = function History(window) {
  window.history = {
    pushState: function(data, title, url) {
      window.FruitLoops.redirect(url);
    },
    replaceState: function(data, title, url) {
      window.FruitLoops.redirect(url);
    }
  };

  return {
    dispose: function() {
      window = window.history = undefined;
    }
  };
};
