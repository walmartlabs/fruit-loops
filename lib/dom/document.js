
module.exports = function(window) {
  window.document = {
    get body() {
      return window.$('body')[0];
    },

    querySelector: function(selector) {
      return window.$(selector)[0];
    },
    querySelectorAll: function(selector) {
      return window.$(selector);
    },
    createElement: function(tagName) {
      return window.$('<' + tagName + '>');
    }
  };

  window.document.defaultView = window;
};
