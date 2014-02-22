var storage = require('../../lib/dom/storage');

describe('storage', function() {
  it('should extend the window', function() {
    var window = {};
    storage(window, 'localStorage');
    should.exist(window.localStorage);

    storage(window, 'sessionStorage');
    should.exist(window.sessionStorage);
  });

  it('should save date', function() {
    var window = {};
    storage(window, 'localStorage');

    should.not.exist(window.localStorage.getItem('foo'));
    window.localStorage.length.should.equal(0);

    window.localStorage.setItem('foo', 'bar');
    window.localStorage.getItem('foo').should.equal('bar');
    window.localStorage.length.should.equal(1);

    window.localStorage.removeItem('foo');
    should.not.exist(window.localStorage.getItem('foo'));
    window.localStorage.length.should.equal(0);
  });
});
