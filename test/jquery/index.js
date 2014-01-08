var $ = require('../../lib/jquery'),
    Cheerio = require('cheerio'),
    dom = require('../../lib/dom');

describe('$', function() {
  var window,
      inst;
  beforeEach(function() {
    window = {};
    dom.document(window);
    dom.navigator(window, {userAgent: ''});
    inst = $(window, '');
  });

  describe('document object', function() {
    it('should accept document object', function() {
      inst.$(window.document).should.be.instanceOf(Cheerio);
      inst.$('document').should.be.instanceOf(Cheerio);
    });
    describe('#ready', function() {
      it('should work on query', function(done) {
        inst.$('document').ready(done);
      });
      it('should work on literal', function(done) {
        inst.$(window.document).ready(done);
      });
    });
    it('should fake event binding', function() {
      var doc = inst.$(window.document);
      doc.on('foo', function(){}).should.equal(doc);
      doc.off('foo', function(){}).should.equal(doc);
    });
  });
  describe('window object', function() {
    it('should accept window object', function() {
      inst.$(window).should.be.instanceOf(Cheerio);
    });
    it('should fake event binding', function() {
      var doc = inst.$(window);
      doc.on('foo', function(){}).should.equal(doc);
      doc.off('foo', function(){}).should.equal(doc);
    });
  });

  describe('#param', function() {
    it('should return params', function() {
      inst.$.param({foo: ' bar', baz: 'bat='}).should.equal('foo=%20bar&baz=bat%3D');
    });
  });
});
