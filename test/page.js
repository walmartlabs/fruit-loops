var fruitLoops = require('../lib'),
    exec = require('../lib/exec'),
    fs = require('fs'),
    sinon = require('sinon');

describe('page', function() {
  it('should load html source', function(done) {
    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/empty-page.html',
      loaded: function(err, window) {
        window.$.should.exist;
        window.$serverSide.should.be.true;
        done();
      }
    });
  });
  it('should callback before script init', function(done) {
    var execCalled;
    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/script-page.html',
      beforeExec: function(window, next) {
        should.exist(window);
        execCalled = true;
        next();
      },
      loaded: function() {
        execCalled.should.be.true;
        page.window.inlinedVar.should.equal(1);
        page.window.externalVar.should.equal(2);
        page.window.syncVar.should.equal(3);
        done();
      }
    });
  });
  it('should load all inlined scripts', function(done) {
    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/script-page.html',
      loaded: function() {
        page.window.inlinedVar.should.equal(1);
        page.window.externalVar.should.equal(2);
        page.window.syncVar.should.equal(3);
        done();
      }
    });
  });
  it('should allow custom file resolution', function(done) {
    var resolver = this.spy(function() {
      return __dirname + '/artifacts/other-script.js';
    });

    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/script-page.html',
      resolver: resolver,
      loaded: function() {
        resolver.should
            .have.been.calledOnce
            .have.been.calledWith('/test-script.js', page.window);

        page.window.inlinedVar.should.equal(1);
        page.window.externalVar.should.equal(3);
        page.window.syncVar.should.equal(4);
        done();
      }
    });
  });
  it('should error on missing scripts', function(done) {
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
      callback: function(err) {
        err.should.be.instanceOf(Error);
        done();
      }
    });
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

  it('should output on emit call', function(done) {
    var finalize = this.spy();

    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/empty-page.html',
      finalize: finalize,
      loaded: function(err, window) {
        should.not.exist(undefined);

        window.emit();
        setTimeout.clock.tick(1000);
      },
      callback: function(err, html) {
        finalize.should.have.been.calledOnce;
        finalize.should.have.been.calledWith(undefined, page.window);

        should.not.exist(err);
        html.should.equal('<!doctype html>\n<html>\n  <body>foo<script>var $serverCache = {};</script></body>\n</html>\n');
        done();
      }
    });
  });

  it('should cache scripts', function(done) {
    var resolver = this.spy(function() {
      return __dirname + '/artifacts/other-script.js';
    });
    this.spy(fs, 'readFile');

    var page;
    function exec(loaded) {
      page = fruitLoops.page({
        userAgent: 'anything but android',
        cacheResources: true,
        url: {
          path: '/foo'
        },
        index: __dirname + '/artifacts/script-page.html',
        resolver: resolver,
        loaded: function() {
          resolver.should
              .have.been.calledWith('/test-script.js', page.window);

          page.window.inlinedVar.should.equal(1);
          page.window.externalVar.should.equal(3);
          page.window.syncVar.should.equal(4);
          loaded();
        }
      });
    }

    exec(function() {
      resolver.should.have.been.calledOnce;
      fs.readFile.should.have.been.calledTwice;

      exec(function() {
        resolver.should.have.been.calledTwice;
        fs.readFile.should.have.been.calledTwice;

        done();
      });
    });
  });
});
