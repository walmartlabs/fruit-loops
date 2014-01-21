var ajax = require('../../lib/jquery/ajax');

describe('ajax', function() {
  it('should extend $', function() {
    var $ = {};
    ajax($);
    should.exist($.ajax);
  });

  describe('#ajax', function() {
    it('should make request');
    it('should handle jsonp requests');

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
