var fruitLoops = require('../../lib'),
    exec = require('../../lib/exec');

describe('async', function() {
  var spy,
      page;

  beforeEach(function() {
    spy = this.spy();
    this.stub(exec, 'exec', function(callback) { callback(); });

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

      exec.exec.should.have.been.called;
      timeoutSpy.should.have.been.calledOnce;
      spy.should.not.have.been.called;
    });
    it('should handle throws', function() {
      this.stub(process, 'nextTick', function(callback) { callback(); });

      var error;
      page.window.nextTick(function() {
        error = new Error();
        throw error;
      });
      this.clock.tick(100);

      exec.exec.should.have.been.called;
      spy.should.have.been.calledWith(error);
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

      exec.exec.should.have.been.called;
      timeoutSpy.should.have.been.calledOnce;
      spy.should.not.have.been.called;
    });
    it('should handle throws', function() {
      var error;
      page.window.setTimeout(function() {
        error = new Error();
        throw error;
      });
      this.clock.tick(100);

      exec.exec.should.have.been.called;
      spy.should.have.been.calledWith(error);
    });
    it('should clear on clearTimeout', function() {
      var timeoutSpy = this.spy();
      var timeout = page.window.setTimeout(timeoutSpy);
      page.window.clearTimeout(timeout);
      this.clock.tick(100);

      exec.exec.should.not.have.been.called;
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
          exec.exec.should.have.been.called;
          spy.should.not.have.been.called;

          done();
        });
      });
    });
    it('should handle throws', function(done) {
      var error;
      page.window.setImmediate(function() {
        error = new Error();
        throw error;
      });

      setImmediate(function() {
        exec.exec.should.have.been.called;
        spy.should.have.been.calledWith(error);
        done();
      });
    });
    it('should clear on clearImmediate', function(done) {
      var timeoutSpy = this.spy();
      var timeout = page.window.setImmediate(timeoutSpy);
      page.window.clearImmediate(timeout);

      setImmediate(function() {
        exec.exec.should.not.have.been.called;
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
