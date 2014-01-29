var history = require('../../lib/dom/history');

describe('history', function() {
  it('should extend the window', function() {
    var window = {};
    history(window, this.spy());
    should.exist(window.history);
  });

  describe('#pushState', function() {
    it('should redirect', function() {
      var spy = this.spy(),
          window = {};
      history(window, spy);

      window.history.pushState('', '', 'foo');
      spy.calledWith('foo').should.be.true;
    });
  });
  describe('#replaceState', function() {
    it('should redirect', function() {
      var spy = this.spy(),
          window = {};
      history(window, spy);

      window.history.replaceState('', '', 'foo');
      spy.calledWith('foo').should.be.true;
    });
  });
});
