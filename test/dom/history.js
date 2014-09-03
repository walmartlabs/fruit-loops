var history = require('../../lib/dom/history');

describe('history', function() {
  var spy,
      window;
  beforeEach(function() {
    spy = this.spy();
    window = {
      FruitLoops: {
        redirect: spy
      }
    };
  });
  it('should extend the window', function() {
    history(window);
    should.exist(window.history);
  });

  describe('#pushState', function() {
    it('should redirect', function() {
      history(window);

      window.history.pushState('', '', 'foo');
      spy.calledWith('foo').should.be.true;
    });
  });
  describe('#replaceState', function() {
    it('should redirect', function() {
      history(window);

      window.history.replaceState('', '', 'foo');
      spy.calledWith('foo').should.be.true;
    });
  });
});
