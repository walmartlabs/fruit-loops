var fruitLoops = require('../../lib'),
    Exec = require('../../lib/exec'),
    sinon = require('sinon');

describe('async', function() {
  var spy,
      page;

  beforeEach(function() {
    spy = this.spy();

    page = fruitLoops.page({
      userAgent: 'anything but android',
      url: {
        path: '/foo'
      },
      index: __dirname + '/../artifacts/empty-page.html',
      callback: spy
    });
  });

  describe('#nextTick', function() {
    it('should execute via nextTick', function() {
      this.stub(process, 'nextTick', function(callback) { callback(); });

      var timeoutSpy = this.spy();
      page.window.nextTick(timeoutSpy);
      this.clock.tick(100);

      timeoutSpy.should.have.been.calledOnce;
      spy.should.not.have.been.called;
    });
    it('should handle throws', function() {
      this.stub(process, 'nextTick', function(callback) { callback(); });

      page.window.nextTick(function() {
        throw new Error('Expected!');
      });
      this.clock.tick(100);

      spy.firstCall.args[0].should.match(/Expected!/);
    });

    it('should cancel exec', function() {
      var callback;
      this.stub(process, 'nextTick', function(_callback) { callback = _callback; });

      var timeoutSpy = this.spy();
      page.window.nextTick(timeoutSpy);

      page.pending.reset();
      callback();

      timeoutSpy.should.not.have.been.called;
      spy.should.not.have.been.called;
    });

    it('should emit after all timeouts are complete', function(done) {
      this.clock.restore();

      var emit = this.spy(),
          timeout = this.spy();
      page = fruitLoops.page({
        userAgent: 'anything but android',
        url: {
          path: '/foo'
        },
        index: __dirname + '/../artifacts/empty-page.html',
        loaded: function() {
          page.window.nextTick(timeout, 10);
          page.window.nextTick(timeout, 100);
          page.window.emit('events');
        },
        callback: function(err) {
          timeout.should.have.been.calledTwice;
          done();
        }
      });
    });
  });

  describe('#setTimeout', function() {
    it('should execute via setTimeout', function() {
      var timeoutSpy = this.spy();
      page.window.setTimeout(timeoutSpy);
      this.clock.tick(100);

      timeoutSpy.should.have.been.calledOnce;
      spy.should.not.have.been.called;
    });
    it('should execute via setTimeout with args', function() {
      var timeoutSpy = this.spy();
      page.window.setTimeout(timeoutSpy, 10, 3, 2, 1);
      this.clock.tick(100);

      timeoutSpy.should.have.been.calledOnce;
      timeoutSpy.should.have.been.calledWith(3, 2, 1);
      spy.should.not.have.been.called;
    });
    it('should handle throws', function() {
      page.window.setTimeout(function() {
        throw new Error('Expected!');
      });
      this.clock.tick(100);

      spy.firstCall.args[0].should.match(/Expected!/);
    });
    it('should clear on clearTimeout', function() {
      var timeoutSpy = this.spy();
      var timeout = page.window.setTimeout(timeoutSpy);
      page.window.clearTimeout(timeout);
      this.clock.tick(100);

      timeoutSpy.should.not.have.been.called;
      spy.should.not.have.been.called;
    });

    it('should emit after all timeouts are complete', function(done) {
      this.clock.restore();

      var emit = this.spy(),
          timeout = this.spy();
      page = fruitLoops.page({
        userAgent: 'anything but android',
        url: {
          path: '/foo'
        },
        index: __dirname + '/../artifacts/empty-page.html',
        loaded: function() {
          page.window.setTimeout(timeout, 10);
          page.window.setTimeout(timeout, 100);
          page.window.emit('events');
        },
        callback: function(err) {
          timeout.should.have.been.calledTwice;
          done();
        }
      });
    });
  });

  describe('#setImmediate', function() {
    it('should execute via setImmediate', function(done) {
      page.window.setImmediate(function() {
        setImmediate(function() {
          spy.should.not.have.been.called;

          done();
        });
      });
    });
    it('should handle throws', function(done) {
      page.window.nextTick(function() {
        throw new Error('Expected!');
      });

      setImmediate(function() {
        spy.firstCall.args[0].should.match(/Expected!/);
        done();
      });
    });
    it('should clear on clearImmediate', function(done) {
      var timeoutSpy = this.spy();
      var timeout = page.window.setImmediate(timeoutSpy);
      page.window.clearImmediate(timeout);

      setImmediate(function() {
        timeoutSpy.should.not.have.been.called;
        spy.should.not.have.been.called;
        done();
      });
    });

    it('should emit after all timeouts are complete', function(done) {
      this.clock.restore();

      var emit = this.spy(),
          timeout = this.spy();
      page = fruitLoops.page({
        userAgent: 'anything but android',
        url: {
          path: '/foo'
        },
        index: __dirname + '/../artifacts/empty-page.html',
        loaded: function() {
          page.window.setImmediate(timeout, 10);
          page.window.setImmediate(timeout, 100);
          page.window.emit('events');
        },
        callback: function(err) {
          timeout.should.have.been.calledTwice;
          done();
        }
      });
    });
  });
});
