var location = require('../../lib/dom/location');

describe('dom.location', function() {
  var window,
      spy;
  beforeEach(function() {
    spy = this.spy();

    window = {
      FruitLoops: {
        redirect: spy
      },
      document: {}
    };
  });

  it('should generate location', function() {
    location.preInit(window);
    location(window, 'http://foo.bar/foo/bar?baz=bat&boz=');
    window.location.host.should.equal('foo.bar');
    window.location.path.should.equal('/foo/bar');
    window.location.origin.should.equal('http://foo.bar');
    window.location.search.should.equal('?baz=bat&boz=');
    window.location.hash.should.equal('');
    (window.location+'').should.equal('http://foo.bar/foo/bar?baz=bat&boz=');
  });
  it('should handle ports', function() {
    location.preInit(window);
    location(window, 'https://foo.bar:8080/foo/bar?baz=bat&boz=');
    window.location.host.should.equal('foo.bar:8080');
    window.location.origin.should.equal('https://foo.bar:8080');
  });
  it('should provide non-null failover', function() {
    location.preInit(window);
    location(window, 'http://foo.bar');
    window.location.host.should.equal('foo.bar');
    window.location.path.should.equal('/');
    window.location.origin.should.equal('http://foo.bar');
    window.location.search.should.equal('');
    window.location.hash.should.equal('');
    (window.location+'').should.equal('http://foo.bar/');
  });

  it('should redirect on assign()', function() {
    location.preInit(window);
    location(window, 'https://foo.bar:8080/foo/bar?baz=bat&boz=');
    window.location.assign('/foo');

    spy.should.have.been.calledWith('/foo');
  });

  it('should redirect on window field assign', function() {
    location.preInit(window);
    location(window, 'https://foo.bar:8080/foo/bar?baz=bat&boz=');
    window.location = '/foo';

    spy.should.have.been.calledWith('/foo');
  });
  it('should redirect on document field assign', function() {
    location.preInit(window);
    location(window, 'https://foo.bar:8080/foo/bar?baz=bat&boz=');
    window.location = '/foo';

    spy.should.have.been.calledWith('/foo');
  });
  it('should reset search and query parts of url', function() {
    location.preInit(window);
    var loc = location(window, 'http://foo.bar/foo/bar?baz=bat&boz=');
    loc.reset('http://foo1.bar1/foo1/bar1');
    window.location.host.should.equal('foo1.bar1');
    window.location.path.should.equal('/foo1/bar1');
    window.location.origin.should.equal('http://foo1.bar1');
    window.location.search.should.equal('');
    window.location.query.should.eql({});
    window.location.hash.should.equal('');
    (window.location+'').should.equal('http://foo1.bar1/foo1/bar1');
  });
});
