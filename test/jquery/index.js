var $ = require('../../lib/jquery');

describe('$', function() {
  describe('#param', function() {
    it('should return params', function() {
      var inst = $({navigator: {userAgent: ''}}, '');
      inst.$.param({foo: ' bar', baz: 'bat='}).should.equal('foo=%20bar&baz=bat%3D');
    });
  });
});
