var sinon = require('sinon');

var performance = require('../../lib/dom/performance');

describe('dom - performance', function() {
  it('should record naviagationStart', function() {
    sinon.stub(Date, 'now', function() { return 42; });

    var window = {};
    performance(window);

    window.performance.timing.navigationStart.should.equal(42);
  });
});
