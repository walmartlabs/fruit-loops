var navigator = require('../../lib/dom/navigator');

describe('dom.navigator', function() {
  var window;
  beforeEach(function() {
    window = {};
  });

  it('should record user agent', function() {
    navigator(window, {userAgent: 'foo'});
    window.navigator.userAgent.should.equal('foo');
  });
});
