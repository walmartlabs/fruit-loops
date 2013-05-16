var fruitLoops = require('../lib'),
    exec = require('../lib/exec'),
    sinon = require('sinon');

describe('page', function() {
  it('should load html source', function() {
    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/empty-page.html'
    });

    page.window.$.should.exist;
    page.window.$server.should.be.true;
  });
  it('should load all inlined scripts', function() {
    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/script-page.html'
    });
    page.window.inlinedVar.should.equal(1);
    page.window.externalVar.should.equal(2);
  });
  it('should allow custom file resolution', function() {
    var resolver = this.spy(function() {
      return __dirname + '/artifacts/other-script.js';
    });

    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/script-page.html',
      resolver: resolver
    });
    resolver.should
        .have.been.calledOnce
        .have.been.calledWith('/test-script.js', page.window);
    page.window.inlinedVar.should.equal(1);
    page.window.externalVar.should.equal(3);
  });
  it('should error on missing scripts', function() {
    var callback = this.spy();

    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/script-page.html',
      resolver: function() {
        return __dirname + '/artifacts/not-a-script.js';
      },
      callback: callback
    });
    callback.should
        .have.been.calledOnce
        .have.been.calledWith(sinon.match.instanceOf(Error));
  });

  it('should handle throws in nextTick', function() {
    var spy = this.spy();
    this.stub(exec, 'exec', function(callback) { callback(); });
    this.stub(process, 'nextTick', function(callback) {
      callback();
    });

    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/empty-page.html',
      callback: spy
    });

    var error;
    page.window.nextTick(function() {
      error = new Error();
      throw error;
    });
    process.nextTick.should.have.been.called;
    exec.exec.should.have.been.called;
    spy.should.have.been.calledWith(error);
  });
});
