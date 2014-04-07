var _ = require('lodash'),
    FruitLoops = require('../lib'),
    fs = require('fs');

describe('#pool', function() {
  var pool;
  afterEach(function() {
    pool && pool.dispose();
    pool = undefined;
  });

  it('should serve pages on navigate', function(done) {
    var emitCalled;

    pool = FruitLoops.pool({
      poolSize: 2,
      host: 'winning',
      index: __dirname + '/artifacts/pool-page.html',
      loaded: function(page) {
        page.window.$.should.exist;
        page.window.$serverSide.should.be.true;
        page.window.loadedCallback = true;
      },
      navigated: function(page, existingPage) {
        existingPage.should.be.false;

        page.window.navigated();
        page.emit('events');
      },
      callback: function() {
        throw new Error('should not be called');
      },
      cleanup: function() {
        emitCalled.should.be.true;
        done();
      }
    });
    pool.navigate('/bar', function(err, html) {
      emitCalled = true;
      should.not.exist(err);
      html.should.match(/"location-info">http:\/\/winning\/bar true<\/div>/);
    });
  });
  it('should create up to poolSize VMs', function(done) {
    this.clock.restore();

    function _done() {
      returned++;
      if (returned >= 2) {
        _.keys(ids).length.should.equal(2);

        done();
      }
    }

    var ids = {},
        returned = 0;

    pool = FruitLoops.pool({
      poolSize: 2,
      host: 'winning',
      index: __dirname + '/artifacts/pool-page.html',
      loaded: function(page) {
        page.window.$.should.exist;
        page.window.$serverSide.should.be.true;
        page.window.loadedCallback = true;

        ids[page.window._id] = true;
      },
      navigated: function(page, existingPage) {
        existingPage.should.be.false;

        page.window.navigated();
        setTimeout(function() {
          page.emit('events');
        }, 10);
      },
      callback: function() {
        throw new Error('should not be called');
      }
    });
    pool.navigate('/bar', function(err, html) {
      should.not.exist(err);
      html.should.match(/"location-info">http:\/\/winning\/bar true<\/div>/);

      _done();
    });
    pool.navigate('/baz', function(err, html) {
      should.not.exist(err);
      html.should.match(/"location-info">http:\/\/winning\/baz true<\/div>/);

      _done();
    });
  });
  it('should queue requests above the pool size', function(done) {
    this.clock.restore();

    function _done() {
      returned++;
      if (returned >= 3) {
        _.keys(ids).length.should.equal(2);

        done();
      }
    }

    var ids = {},
        navigated = 0,
        returned = 0;

    pool = FruitLoops.pool({
      poolSize: 2,
      host: 'winning',
      index: __dirname + '/artifacts/pool-page.html',
      loaded: function(page) {
        page.window.$.should.exist;
        page.window.$serverSide.should.be.true;
        page.window.loadedCallback = true;

        ids[page.window._id] = true;
      },
      navigated: function(page, existingPage) {
        existingPage.should.equal(++navigated > 2);

        page.window.navigated();
        setTimeout(function() {
          page.emit('events');
        }, 10);
      },
      callback: function() {
        throw new Error('should not be called');
      }
    });
    pool.navigate('/bar', function(err, html) {
      should.not.exist(err);
      html.should.match(/"location-info">http:\/\/winning\/bar true<\/div>/);

      _done();
    });
    pool.navigate('/baz', function(err, html) {
      should.not.exist(err);
      html.should.match(/"location-info">http:\/\/winning\/baz true<\/div>/);

      _done();
    });
    pool.navigate('/bat', function(err, html) {
      should.not.exist(err);
      html.should.match(/"location-info">http:\/\/winning\/bat true<\/div>/);

      _done();
    });
  });
  it('should invalidate pages on error', function(done) {
    this.clock.restore();

    function _done() {
      returned++;
      if (returned >= 3) {
        _.keys(ids).length.should.equal(3);

        done();
      }
    }

    var ids = {},
        returned = 0;

    pool = FruitLoops.pool({
      poolSize: 2,
      host: 'winning',
      index: __dirname + '/artifacts/pool-page.html',
      loaded: function(page) {
        page.window.$.should.exist;
        page.window.$serverSide.should.be.true;
        page.window.loadedCallback = true;

        ids[page.window._id] = true;
      },
      navigated: function(page, existingPage) {
        existingPage.should.be.false;

        page.window.navigated();
        page.window.setTimeout(function() {
          throw new Error('Errored!');
        }, 10);
      },
      callback: function() {
        throw new Error('should not be called');
      }
    });
    pool.navigate('/bar', function(err, html) {
      err.toString().should.match(/Errored!/);
      _done();
    });
    pool.navigate('/baz', function(err, html) {
      err.toString().should.match(/Errored!/);
      _done();
    });
    pool.navigate('/bat', function(err, html) {
      err.toString().should.match(/Errored!/);
      _done();
    });
  });
  it('should reset on watch change', function(done) {
    this.clock.restore();

    var watchCallback;
    this.stub(fs, 'watch', function(fileName, options, callback) {
      watchCallback = callback;
      return { close: function() {} };
    });

    var ids = {};

    pool = FruitLoops.pool({
      poolSize: 2,
      host: 'winning',
      index: __dirname + '/artifacts/script-page.html',
      loaded: function(page) {
        ids[page.window._id] = true;
      },
      navigated: function(page, existingPage) {
        existingPage.should.be.false;

        ids[page.window._id] = true;

        page.window.emit();
      }
    });
    pool.navigate('/bar', function(err, html) {
      setImmediate(function() {
        watchCallback();

        pool.navigate('/baz', function(err, html) {
          _.keys(ids).length.should.equal(2);
          done();
        });
      });
    });
  });
  it('should error with incorrect args', function() {
    should.Throw(function() {
      FruitLoops.pool({
        loaded: function(page) {
          throw new Error('should not be called');
        },
        navigated: function(page) {
          throw new Error('should not be called');
        },
        callback: function() {
          throw new Error('should not be called');
        }
      });
    }, Error, /Must pass in a poolSize value/);
  });
});
