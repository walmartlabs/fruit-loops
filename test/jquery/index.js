var $ = require('../../lib/jquery'),
    Cheerio = require('cheerio'),
    dom = require('../../lib/dom');

describe('$', function() {
  var window,
      inst;
  beforeEach(function() {
    window = {
      nextTick: function(callback) {
        callback();
      }
    };
    window.self = window;
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
    it('should accept as context', function() {
      inst = $(window, '<div></div>');
      inst.$('div', window.document).length.should.equal(1);
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
    it('should accept as context', function() {
      inst = $(window, '<div></div>');
      inst.$('div', window).length.should.equal(1);
    });
  });

  describe('known caching', function() {
    it('should cache root', function() {
      inst = $(window, '<html></html>');
      inst.$('html', window).should.equal(inst.$(':root', window));
    });
    it('should cache head object', function() {
      inst = $(window, '<head></head>');
      inst.$('head', window).should.equal(inst.$('head', window));

      inst = $(window, '<html><head></head></html>');
      inst.$('head', window).should.equal(inst.$('head', window));
    });
    it('should cache body object', function() {
      inst = $(window, '<body></body>');
      inst.$('body', window).should.equal(inst.$('body', window));

      inst = $(window, '<html><body></body></html>');
      inst.$('body', window).should.equal(inst.$('body', window));
    });
    it('should not fail if there are no such objects', function() {
      inst.$('html', window).length.should.equal(0);
      inst.$('head', window).length.should.equal(0);
      inst.$('body', window).length.should.equal(0);

      inst = $(window, '<div></div>');
      inst.$('html', window).length.should.equal(0);
      // inst.$('head', window).length.should.equal(0);
      // inst.$('body', window).length.should.equal(0);
    });
  });

  describe('#param', function() {
    it('should return params', function() {
      inst.$.param({foo: ' bar', baz: 'bat='}).should.equal('foo=%20bar&baz=bat%3D');
    });
  });
});
