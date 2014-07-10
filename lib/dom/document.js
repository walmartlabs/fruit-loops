
module.exports = function Document(window) {
  /*jshint es5:true */
  window.document = {
    defaultView: window
  };

  return {
    dispose: function() {
      window = window.document = window.defaultView = undefined;
    }
  };
};
