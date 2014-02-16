/*global should */
var ajax = require('../../lib/jquery/ajax'),
    hapi = require('hapi');

describe('ajax', function() {
  var server,
      $,
      inst;
  before(function(done) {
    server = new hapi.Server(0);
    server.route([
      {
        path: '/',
        method: 'GET',
        config: {jsonp: 'callback'},
        handler: function(req, reply) {
          reply({data: 'get!'});
        }
      },
      {
        path: '/',
        method: 'POST',
        handler: function(req, reply) {
          req.payload.data = 'post!';
          reply(req.payload);
        }
      },
      {
        path: '/parse',
        method: 'GET',
        handler: function(req, reply) {
          reply('utter crap');
        }
      },
      {
        path: '/error',
        method: 'GET',
        handler: function(req, reply) {
          reply(new Error('error'));
        }
      }
    ]);
    server.start(done);
  });
  after(function(done) {
    server.stop(done);
  });
  beforeEach(function() {
    ajax.reset();

    $ = {};
    inst = ajax($);
  });

  it('should extend $', function() {
    var $ = {};
    ajax($);
    should.exist($.ajax);
  });

  describe('#ajax', function() {
    it('should make request', function(done) {
      var successCalled;
      var xhrReturn = $.ajax({
        url: 'http://localhost:' + server.info.port + '/',
        success: function(data, status, xhr) {
          data.should.eql({data: 'get!'});

          status.should.equal('success');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);
          successCalled = true;
        },
        complete: function(xhr, status) {
          should.exist(successCalled);

          status.should.equal('success');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);

          inst.on('complete', function() {
            done();
          });
        }
      });
      xhrReturn.readyState.should.equal(2);
    });
    it('should handle POST requests', function(done) {
      var successCalled;
      var xhrReturn = $.ajax({
        type: 'POST',
        data: {
          foo: '1',
          bar: '2'
        },
        url: 'http://localhost:' + server.info.port + '/',
        success: function(data, status, xhr) {
          data.should.eql({data: 'post!', foo: '1', bar: '2'});

          status.should.equal('success');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);
          successCalled = true;
        },
        complete: function(xhr, status) {
          should.exist(successCalled);

          status.should.equal('success');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);

          inst.on('complete', function() {
            done();
          });
        }
      });
      xhrReturn.readyState.should.equal(2);
    });
    it('should handle jsonp requests', function(done) {
      var successCalled;
      var xhrReturn = $.ajax({
        url: 'http://localhost:' + server.info.port + '/?callback=?',
        success: function(data, status, xhr) {
          data.should.eql({data: 'get!'});

          status.should.equal('success');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);
          successCalled = true;
        },
        complete: function(xhr, status) {
          should.exist(successCalled);

          status.should.equal('success');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);

          inst.on('complete', function() {
            done();
          });
        }
      });
    });
    it('should short circuit cached requests', function(done) {
      $.ajax({
        url: 'http://localhost:' + server.info.port + '/',
        success: function(data, status, xhr) {
          data.modified = true;
        },
        complete: function(xhr, status) {
          setImmediate(function() {
            var xhrReturn = $.ajax({
              url: 'http://localhost:' + server.info.port + '/',
              success: function(data, status, xhr) {
                data.should.eql({data: 'get!'});

                status.should.equal('success');

                xhr.should.equal(xhrReturn);
                xhr.readyState.should.equal(4);

                inst.on('complete', function() {
                  done();
                });
              }
            });
            xhrReturn.readyState.should.equal(4);
          });
        }
      });
    });

    it('should handle http errors', function(done) {
      var errorCalled;
      var xhrReturn = $.ajax({
        url: 'http://localhost:' + server.info.port + '/error',
        success: function(data, status, xhr) {
          throw new Error('Should not have been called');
        },
        error: function(xhr, status, err) {
          status.should.equal('error');

          xhr.should.equal(xhrReturn);
          xhr.responseText.should.match(/"statusCode":500,/);
          xhr.readyState.should.equal(4);
          errorCalled = true;
        },
        complete: function(xhr, status) {
          should.exist(errorCalled);

          status.should.equal('error');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);

          inst.on('complete', function() {
            done();
          });
        }
      });
      xhrReturn.readyState.should.equal(2);
    });
    it('should handle syntax errors', function(done) {
      var errorCalled;
      var xhrReturn = $.ajax({
        url: 'http://localhost:' + server.info.port + '/parse',
        success: function(data, status, xhr) {
          throw new Error('Should not have been called');
        },
        error: function(xhr, status, err) {
          status.should.equal('parsererror');

          xhr.should.equal(xhrReturn);
          xhr.responseText.should.equal('utter crap');
          xhr.readyState.should.equal(4);
          errorCalled = true;
        },
        complete: function(xhr, status) {
          should.exist(errorCalled);

          status.should.equal('parsererror');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);
        }
      });
      inst.on('complete', function() {
        done();
      });
      xhrReturn.readyState.should.equal(2);
    });

    it('should allow specific requests to be cancelled', function(done) {
      var errorCalled = 0,
          spy = this.spy();

      var xhrReturn = $.ajax({
        url: 'http://localhost:' + server.info.port + '/',
        success: spy,
        error: function(xhr, status, err) {
          status.should.equal('abort');

          xhr.should.equal(xhrReturn);
          xhr.responseText.should.equal('');
          xhr.readyState.should.equal(4);
          errorCalled++;
        },
        complete: function(xhr, status) {
          errorCalled.should.equal(1);
          spy.callCount.should.equal(0);

          status.should.equal('abort');

          xhr.should.equal(xhrReturn);
          xhr.readyState.should.equal(4);

          // Should do nothing
          xhrReturn.abort();
        }
      });
      inst.on('complete', function() {
        done();
      });
      xhrReturn.abort();
    });
    it('should track ttl');
  });

  it('should record all complete', function(done) {
    inst.once('complete', function() {
      inst.allComplete().should.be.true;
      done();
    });

    $.ajax({
      type: 'POST',
      url: 'http://localhost:' + server.info.port + '/',
      success: function(data, status, xhr) {
        inst.allComplete().should.be.false;
      },
      complete: function(xhr, status) {
        inst.allComplete().should.be.false;
      }
    });

    inst.allComplete().should.be.false;
  });
  it('should output returned values', function(done) {
    $.ajax({
      url: 'http://localhost:' + server.info.port + '/'
    });
    $.ajax({
      type: 'POST',
      url: 'http://localhost:' + server.info.port + '/?post',
      cacheUrl: '/bar'
    });
    $.ajax({
      url: 'http://localhost:' + server.info.port + '/error',
      cacheUrl: 'http://localhost:' + server.info.port + '/error'
    });
    $.ajax({
      url: 'http://localhost:' + server.info.port + '/parse'
    });

    inst.on('complete', function() {
      if (inst.allComplete()) {
        var cache = {};
        cache['http://localhost:' + server.info.port + '/'] = {data: 'get!'};
        cache['/bar'] = {data: 'post!'};
        JSON.parse(inst.toJSON()).should.eql(cache);
        done();
      }
    });
  });
  it('should allow all pending requests to be cancelled', function(done) {
    var xhr1 = $.ajax({
      url: 'http://localhost:' + server.info.port + '/'
    });
    this.spy(xhr1, 'abort');

    var xhr2 = $.ajax({
      type: 'POST',
      url: 'http://localhost:' + server.info.port + '/?post',
      cacheUrl: '/bar'
    });
    this.spy(xhr2, 'abort');

    inst.on('complete', function() {
      if (inst.allComplete()) {
        xhr1.abort.callCount.should.equal(1);
        xhr2.abort.callCount.should.equal(1);
        done();
      }
    });
    inst.reset();
  });
});
