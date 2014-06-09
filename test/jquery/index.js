var $ = require('../../lib/jquery'),
    Cheerio = require('cheerio'),
    dom = require('../../lib/dom');

describe('$', function() {
  var window,
      inst;
  beforeEach(function() {
    window = {
      eval: this.spy(),

      toString: function() {
        return '[object Window]';
      },
      nextTick: function(callback) {
        callback();
      }
    };
    window.self = window;
    dom.document(window);
    dom.navigator(window, {userAgent: ''});
    inst = $(window, '');
  });

  describe('function object', function() {
    it('should work on function', function(done) {
      inst.$(done);
    });
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
      inst.$('head', window).length.should.equal(0);
      inst.$('body', window).length.should.equal(0);
    });
  });

  describe('#each', function() {
    it('should iterate arrays', function() {
      var spy = this.spy(function(i, value) {
        this.should.equal(value);
        value.should.equal((i+1)*10);
      });
      inst.$.each([10, 20, 30, 40], spy);
      spy.callCount.should.equal(4);
    });
    it('should iterate objects', function() {
      var spy = this.spy(function(key, value) {
        this.should.equal(value);
        if (key === 'a') {
          value.should.equal(10);
        } else if (key === 'b') {
          value.should.equal(20);
        } else if (key === 'c') {
          value.should.equal(30);
        } else if (key === 'd') {
          value.should.equal(40);
        } else {
          throw new Error();
        }
      });
      inst.$.each({'a':10, 'b':20, 'c':30, 'd':40}, spy);
      spy.callCount.should.equal(4);
    });
    it('should terminate early', function() {
      var spy = this.spy(function(i, value) {
        this.should.equal(value);
        if (i === 2) {
          return false;
        }
      });
      inst.$.each([10, 20, 30, 40], spy);
      spy.callCount.should.equal(3);
    });
  });

  describe('#extend', function() {
    it('should extend the object', function() {
      inst.$.extend({}, {'foo': 'bar'}, {'baz': 'bat'}).should.eql({
        'foo': 'bar',
        'baz': 'bat'
      });
    });
    it('should handle deep parameter', function() {
      inst.$.extend(true, {}, {'foo': [1,2,3,4], 'bat': {'bat': true}}, {'foo': [3,4], 'bat': {baz: 'bar'}}).should.eql({
        'foo': [3,4,3,4],
        'bat': {bat: true, baz: 'bar'}
      });
    });
  });
  describe('#globalEval', function() {
    it('should execute eval', function() {
      inst.$.globalEval('foo');
      window.eval.should.have.been.calledWith('foo');
    });
  });
  describe('#grep', function() {
    it('should filter', function() {
      inst.$.grep([1,2,3], function(value) { return value > 1; }).should.eql([2,3]);
    });
  });
  describe('#inArray', function() {
    it('should look up elements', function() {
      inst.$.inArray(1, [1,2,3]).should.equal(0);
      inst.$.inArray(2, [1,2,3]).should.equal(1);
    });
    it('should handle missing', function() {
      inst.$.inArray(4, [1,2,3]).should.equal(-1);
    });
    it('should handle fromIndex', function() {
      inst.$.inArray(1, [1,2,3], 0).should.equal(0);
      inst.$.inArray(1, [1,2,3], 1).should.equal(-1);
    });
  });

  describe('#isArray', function() {
    it('should handle arrays', function() {
      inst.$.isArray([]).should.be.true;
    });
    it('should handle non-arrays', function() {
      inst.$.isArray({}).should.be.false;
    });
  });
  describe('#isFunction', function() {
    it('should handle functions', function() {
      inst.$.isFunction(function() {}).should.be.true;
    });
    it('should handle non-functions', function() {
      inst.$.isFunction({}).should.be.false;
    });
  });
  describe('#isNumeric', function() {
    it('should handle number', function() {
      inst.$.isNumeric(4).should.be.true;
      inst.$.isNumeric(new Number(4)).should.be.true;
    });
    it('should handle non-number', function() {
      inst.$.isNumeric({}).should.be.false;
    });
  });
  describe('#isEmptyObject', function() {
    it('should handle empty objects', function() {
      inst.$.isEmptyObject({}).should.be.true;
    });
    it('should handle non-empty objects', function() {
      inst.$.isEmptyObject({foo: true}).should.be.false;
      inst.$.isEmptyObject([]).should.be.false;
      inst.$.isEmptyObject(1).should.be.false;
      inst.$.isEmptyObject(window).should.be.false;
      inst.$.isEmptyObject(window.document).should.be.false;
      inst.$.isEmptyObject(inst.$(window.document)).should.be.false;
    });
  });
  describe('#isPlainObject', function() {
    it('should handle plain objects', function() {
      inst.$.isPlainObject({}).should.be.true;
      inst.$.isPlainObject({foo: true}).should.be.true;
    });
    it('should handle non-plain objects', function() {
      inst.$.isPlainObject(1).should.be.false;
      inst.$.isPlainObject(window).should.be.false;
      inst.$.isPlainObject(window.document).should.be.false;
      inst.$.isPlainObject(inst.$(window.document)).should.be.false;
    });
  });
  describe('#isWindow', function() {
    it('should handle window', function() {
      inst.$.isWindow(window).should.be.true;
    });
    it('should handle non-window', function() {
      inst.$.isWindow({}).should.be.false;
    });
  });
  describe('#type', function() {
    it('should handle "undefined"', function() {
      inst.$.type(undefined).should.equal('undefined');
      inst.$.type().should.equal('undefined');
      inst.$.type(window.notDefined).should.equal('undefined');
    });
    it('should handle "null"', function() {
      inst.$.type(null).should.equal('null');
    });
    it('should handle "boolean"', function() {
      inst.$.type(true).should.equal('boolean');
      inst.$.type(new Boolean()).should.equal('boolean');
    });
    it('should handle "number"', function() {
      inst.$.type(3).should.equal('number');
      inst.$.type(new Number(3)).should.equal('number');
    });
    it('should handle "string"', function() {
      inst.$.type("test").should.equal('string');
      inst.$.type(new String("test")).should.equal('string');
    });
    it('should handle "function"', function() {
      inst.$.type(function(){}).should.equal('function');
    });
    it('should handle "array"', function() {
      inst.$.type([]).should.equal('array');
    });
    it('should handle "array"', function() {
      inst.$.type(new Array()).should.equal('array');
    });
    it('should handle "date"', function() {
      inst.$.type(new Date()).should.equal('date');
    });
    it('should handle "error"', function() {
      inst.$.type(new Error()).should.equal('error');
    });
    it('should handle "regexp"', function() {
      inst.$.type(/test/).should.equal('regexp');
    });
    it('should handle "window"', function() {
      inst.$.type(window).should.equal('window');
    });
  });

  describe('#merge', function() {
    it('should merge arrays', function() {
      var arr = [1,2,3];
      inst.$.merge(arr, [4,5]).should.equal(arr);
      arr.should.eql([1,2,3,4,5]);
    });
  });

  describe('#now', function() {
    it('should return current time', function() {
      var base = Date.now();
      inst.$.now().should.equal(base);
      this.clock.tick(123);
      inst.$.now().should.equal(base + 123);
    });
  });

  describe('#param', function() {
    it('should return params', function() {
      inst.$.param({foo: ' bar', baz: 'bat='}).should.equal('foo=%20bar&baz=bat%3D');
    });
  });

  describe('#proxy', function() {
    it('should bind function', function() {
      var context = {},
          spy = this.spy();
      inst.$.proxy(spy, context, 1, 2)();
      spy.should.have.been.calledOn(context);
      spy.should.have.been.calledWith(1, 2);
    });
    it('should bind key function', function() {
      var spy = this.spy(),
          context = {key: spy};

      inst.$.proxy(context, 'key', 1, 2)();
      spy.should.have.been.calledOn(context);
      spy.should.have.been.calledWith(1, 2);
    });
  });

  describe('#trim', function() {
    it('should trim', function() {
      inst.$.trim('  foo ').should.equal('foo');
    });
  });
});
