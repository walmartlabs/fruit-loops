var document = require('../../lib/dom/document');

describe('dom.document', function() {
  var window,
      ret;
  beforeEach(function() {
    ret = [];
    window = {
      $: this.spy(function() { return ret; })
    };
    document(window);
  });

  it('should define proper fields', function() {
    window.document.defaultView.should.equal(window);
  });

  describe('#body', function() {
    it('should return the body query', function() {
      ret = ['foo'];
      window.document.body.should.equal('foo');
      window.$.should.have.been.calledWith('body');
    });
  });
  describe('#querySelector', function() {
    it('should query arbitrary values', function() {
      ret = ['foo'];
      window.document.querySelector('bar').should.equal('foo');
      window.$.should.have.been.calledWith('bar');
    });
  });
  describe('#querySelectorAll', function() {
    it('should query arbitrary values', function() {
      ret = ['foo'];
      window.document.querySelectorAll('bar').should.eql(['foo']);
      window.$.should.have.been.calledWith('bar');
    });
  });
  describe('#createElement', function() {
    it('should query arbitrary values', function() {
      ret = ['foo'];
      window.document.createElement('bar').should.eql(['foo']);
      window.$.should.have.been.calledWith('<bar>');
    });
  });
});
