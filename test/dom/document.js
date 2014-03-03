var document = require('../../lib/dom/document');

describe('dom.document', function() {
  var window,
      ret;
  beforeEach(function() {
    ret = [];
    window = {};
    document(window);
  });

  it('should define proper fields', function() {
    window.document.defaultView.should.equal(window);
  });
});
