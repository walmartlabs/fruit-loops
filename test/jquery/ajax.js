/*global should */
var ajax = require('../../lib/jquery/ajax'),
    hapi = require('hapi');

describe('ajax', function() {
  var server;
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
      }
    ]);
    server.start(done);
  });
  after(function(done) {
    server.stop(done);
  });

  it('should extend $', function() {
    var $ = {};
    ajax($);
    should.exist($.ajax);
  });

  describe('#ajax', function() {
    var $;
    beforeEach(function() {
      $ = {};
      ajax($);
    });
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
          done();
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
          done();
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
          done();
        }
      });
    });
    it('should short circuit cached requests');

    it('should allow requests to be cancelled');
    it('should handle syntax errors');
    it('should track ttl');
    it('should pass cookies in user mode');
    it('should emit complete');
  });

  it('should output returned values');
  it('should record all complete');
  it('should allow all pending requests to be cancelled');
});
