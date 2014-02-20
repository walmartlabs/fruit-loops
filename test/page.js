var fruitLoops = require('../lib'),
    exec = require('../lib/exec'),
    fs = require('fs'),
    hapi = require('hapi'),
    sinon = require('sinon');

describe('page', function() {
  var server;
  before(function(done) {
    server = new hapi.Server(0);
    server.route({
      path: '/',
      method: 'GET',
      config: {jsonp: 'callback'},
      handler: function(req, reply) {
        setTimeout(function() {
          reply({data: 'get!'});
        }, 10);
      }
    });
    server.start(done);
  });
  after(function(done) {
    server.stop(done);
  });

  it('should load html source', function(done) {
    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/empty-page.html',
      loaded: function(page) {
        page.window.$.should.exist;
        page.window.$serverSide.should.be.true;
        done();
      }
    });
  });
  it('should handle page load errors', function(done) {
    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/artifacts/does-not-exist.html',
      callback: function(err) {
        err.should.be.instanceOf(Error);
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
      beforeExec: function(page, next) {
        should.exist(page);
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
      url: '/foo',
      index: __dirname + '/artifacts/script-page.html',
      resolver: resolver,
      loaded: function() {
        resolver.should
            .have.been.calledOnce
            .have.been.calledWith('/test-script.js', page);

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

  describe('#emit', function() {
    it('should output on emit call', function(done) {
      var finalize = this.spy();

      var page = fruitLoops.page({
        userAgent: 'anything but android',
        path: '/foo',
        index: __dirname + '/artifacts/empty-page.html',
        finalize: finalize,
        loaded: function(page) {
          page.window.emit();
          setTimeout.clock.tick(1000);
        },
        callback: function(err, html) {
          finalize.should.have.been.calledOnce;
          finalize.should.have.been.calledWith(page);

          should.not.exist(err);
          html.should.equal('<!doctype html>\n<html>\n  <body>foo<script>var $serverCache = {};</script></body>\n</html>\n');
          done();
        }
      });
    });

    describe('ajax completion', function() {
      it('should allow emit on AJAX completion', function(done) {
        var test = this,
            finalize = test.spy(),
            allComplete = false,
            callback = false;

        var page = fruitLoops.page({
          userAgent: 'anything but android',
          url: {
            path: '/foo'
          },
          index: __dirname + '/artifacts/empty-page.html',
          finalize: finalize,
          loaded: function(page) {
            test.stub(page.$.ajax, 'allComplete', function() { return allComplete; });

            page.window.emit('ajax');
            setTimeout.clock.tick(1000);
            callback.should.be.false;

            allComplete = true;
            page.$.ajax.emit('complete');
            setTimeout.clock.tick(1000);
          },
          callback: function(err, html) {
            callback = true;
            allComplete.should.be.true;
            finalize.should.have.been.calledOnce;
            finalize.should.have.been.calledWith(page);

            should.not.exist(err);
            html.should.equal('<!doctype html>\n<html>\n  <body>foo<script>var $serverCache = {};</script></body>\n</html>\n');
            done();
          }
        });
      });
      it('should emit if nothing pending', function(done) {
        var test = this,
            callback = false;

        var page = fruitLoops.page({
          userAgent: 'anything but android',
          url: {
            path: '/foo'
          },
          index: __dirname + '/artifacts/empty-page.html',
          loaded: function(page) {
            callback.should.be.false;
            page.window.emit('ajax');
          },
          callback: function(err, html) {
            callback = true;

            should.not.exist(err);
            html.should.equal('<!doctype html>\n<html>\n  <body>foo<script>var $serverCache = {};</script></body>\n</html>\n');
            done();
          }
        });
      });
    });

    describe('event completion', function() {
      it('should emit after all ajax and timeouts', function(done) {
        this.clock.restore();

        var timeoutSpy = this.spy(),
            ajaxSpy = this.spy(),
            callback = false;

        var page = fruitLoops.page({
          userAgent: 'anything but android',
          url: {
            path: '/foo'
          },
          index: __dirname + '/artifacts/empty-page.html',
          loaded: function(page) {
            callback.should.be.false;

            page.window.setTimeout(timeoutSpy, 25);
            page.window.emit('events');
            page.window.$.ajax({
              url: 'http://localhost:' + server.info.port + '/',
              complete: function() {
                page.window.setTimeout(timeoutSpy, 10);
                ajaxSpy();
              }
            });

          },
          callback: function(err, html) {
            callback = true;

            timeoutSpy.should.have.been.calledTwice;
            ajaxSpy.should.have.been.calledOnce;

            should.not.exist(err);
            html.should.equal('<!doctype html>\n<html>\n  <body>foo<script>var $serverCache = {"http://localhost:' + server.info.port + '/": {"data":"get!"}};</script></body>\n</html>\n');
            done();
          }
        });
      });
      it('should emit events if no events pending', function(done) {
        var callback = false;

        var page = fruitLoops.page({
          userAgent: 'anything but android',
          url: {
            path: '/foo'
          },
          index: __dirname + '/artifacts/empty-page.html',
          loaded: function(page) {
            callback.should.be.false;
            page.window.emit('events');
          },
          callback: function(err, html) {
            callback = true;

            should.not.exist(err);
            html.should.equal('<!doctype html>\n<html>\n  <body>foo<script>var $serverCache = {};</script></body>\n</html>\n');
            done();
          }
        });
      });
    });

    it('should terminate pending', function(done) {
      this.clock.restore();

      function fail() {
        throw new Error('This was called');
      }

      var page = fruitLoops.page({
        userAgent: 'anything but android',
        path: '/foo',
        index: __dirname + '/artifacts/empty-page.html',
        loaded: function(page) {
          page.window.setTimeout(fail, 10);
          page.window.$.ajax({
            url: 'http://localhost:' + server.info.port + '/',
            error: fail,
            complete: fail
          });
          page.window.emit();
        },
        callback: function(err, html) {
          setTimeout(function() {
            done();
          }, 100);
        }
      });
    });

    it('should fail on multiple', function(done) {
      var page = fruitLoops.page({
        userAgent: 'anything but android',
        path: '/foo',
        index: __dirname + '/artifacts/empty-page.html',
        loaded: function(page) {
          page.window.emit();
        },
        callback: function(err, html) {
          should.throw(function() {
            page.emit();
          }, Error, /Emit outside of request:.*/);

          done();
        }
      });
    });

    it('should support multiple emits with navigate', function(done) {
      var finalize = this.spy(),
          firstEmitSeen;

      var page = fruitLoops.page({
        userAgent: 'anything but android',
        path: '/foo',
        index: __dirname + '/artifacts/empty-page.html',
        finalize: finalize,
        loaded: function(page) {
          page.window.emit('events');
          setTimeout.clock.tick(1000);
        },
        callback: function(err, html) {
          should.not.exist(err);
          html.should.equal('<!doctype html>\n<html>\n  <body>foo<script>var $serverCache = {};</script></body>\n</html>\n');

          page.navigate('/bar', function(err, html) {
            finalize.should.have.been.calledTwice;

            should.not.exist(err);
            html.should.equal('<!doctype html>\n<html>\n  <body>foo<script>var $serverCache = {};</script></body>\n</html>\n');

            done();
          });

          page.window.location.toString().should.equal('http://localhost/bar');
          page.emit();
          setTimeout.clock.tick(1000);
        }
      });
    });

    it('should call onEmit callbacks', function(done) {
      var spy = this.spy();

      var page = fruitLoops.page({
        userAgent: 'anything but android',
        path: '/foo',
        index: __dirname + '/artifacts/empty-page.html',
        loaded: function(page) {
          page.window.onEmit(spy);
          page.window.emit();
          setTimeout.clock.tick(1000);
        },
        callback: function(err, html) {
          spy.should.have.been.calledOnce;
          done();
        }
      });
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
        path: '/foo',
        index: __dirname + '/artifacts/script-page.html',
        resolver: resolver,
        loaded: function() {
          resolver.should
              .have.been.calledWith('/test-script.js', page);

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
