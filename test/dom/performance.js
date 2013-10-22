var sinon = require('sinon');

var performance = require('../../lib/dom/performance');

describe('dom.performance', function() {
  var window;
  beforeEach(function() {
    window = {};

    this.stub(Date, 'now', function() { return 42; });
    performance(window);
  });

  it('should record navigationStart', function() {
    window.performance.timing.navigationStart.should.equal(42);
  });
  it('should record domLoading', function() {
    window.performance.timing.domLoading.should.equal(42);
  });
});
