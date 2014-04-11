module.exports = function History(window, redirect) {
  window.history = {
    pushState: function(data, title, url) {
      redirect(url);
    },
    replaceState: function(data, title, url) {
      redirect(url);
    }
  };
};
