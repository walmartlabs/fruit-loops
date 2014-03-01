var $ = require('../../lib/jquery'),
    Cheerio = require('cheerio'),
    dom = require('../../lib/dom');

describe('cheerio-shim', function() {
  var window,
      inst;
  beforeEach(function() {
    window = {
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
    inst = $(window, '<body><div></div><div></div></body>');
  });

  describe('#appendTo', function() {
    it('should insert into', function() {
      inst.$('<span>red</span>').appendTo(inst.$('body'));
      inst.$('body').html().should.equal('<div></div><div></div><span>red</span>');
    });
    it('should insert int selector', function() {
      inst.$('<span>red</span>').appendTo('body');
      inst.$('body').html().should.equal('<div></div><div></div><span>red</span>');
    });
  });
  describe('#insertAfter', function() {
    it('should insert after', function() {
      // WARN: Hacking around a cheerio bug
      // https://github.com/MatthewMueller/cheerio/issues/368
      inst = $(window, '<body><div></div></body>');
      inst.$('<span>red</span>').insertAfter(inst.$('div'));
      inst.$('body').html().should.equal('<div></div><span>red</span>');
    });
    it('should insert after selector', function() {
      // WARN: Hacking around a cheerio bug
      // https://github.com/MatthewMueller/cheerio/issues/368
      inst = $(window, '<body><div></div></body>');
      inst.$('<span>red</span>').insertAfter('div');
      inst.$('body').html().should.equal('<div></div><span>red</span>');
    });
  });
  describe('#insertBefore', function() {
    it('should insert before', function() {
      // WARN: Hacking around a cheerio bug
      // https://github.com/MatthewMueller/cheerio/issues/368
      inst = $(window, '<body><div></div></body>');
      inst.$('<span>red</span>').insertBefore(inst.$('div'));
      inst.$('body').html().should.equal('<span>red</span><div></div>');
    });
    it('should insert before selector', function() {
      // WARN: Hacking around a cheerio bug
      // https://github.com/MatthewMueller/cheerio/issues/368
      inst = $(window, '<body><div></div></body>');
      inst.$('<span>red</span>').insertBefore('div');
      inst.$('body').html().should.equal('<span>red</span><div></div>');
    });
  });
  describe('#prependTo', function() {
    it('should insert into', function() {
      inst.$('<span>red</span>').prependTo(inst.$('body'));
      inst.$('body').html().should.equal('<span>red</span><div></div><div></div>');
    });
    it('should insert into selector', function() {
      inst.$('<span>red</span>').prependTo('body');
      inst.$('body').html().should.equal('<span>red</span><div></div><div></div>');
    });
  });
  describe('#replaceAll', function() {
    it('should replace', function() {
      // WARN: Hacking around a cheerio bug
      // https://github.com/MatthewMueller/cheerio/issues/368
      inst = $(window, '<body><div></div></body>');
      inst.$('<span>red</span>').replaceAll(inst.$('div'));
      inst.$('body').html().should.equal('<span>red</span>');
    });
    it('should replace with selector', function() {
      // WARN: Hacking around a cheerio bug
      // https://github.com/MatthewMueller/cheerio/issues/368
      inst = $(window, '<body><div></div></body>');
      inst.$('<span>red</span>').replaceAll('div');
      inst.$('body').html().should.equal('<span>red</span>');
    });
  });

  describe('#animate', function() {
    it('should set css and callback', function(done) {
      var $el = inst.$('body');
      $el.animate({display: 'none', top: '100px'}, function() {
        $el.css().should.eql({
          display: 'none',
          top: '100px'
        });
        done();
      });
    });
    it('should set css and callback options', function(done) {
      var $el = inst.$('body');
      $el.animate({display: 'none', top: '100px'}, {
        callback: function() {
          $el.css().should.eql({
            display: 'none',
            top: '100px'
          });
          done();
        }
      });
    });
  });

  describe('#get', function() {
    it('should deref individual elements', function() {
      var els = inst.$('div');
      els.eq(1)[0].should.equal(els[1]);
    });
  });

  describe('#forEach', function() {
    it('should iterate', function() {
      var spy = this.spy(),
          els = inst.$('div');

      els.forEach(spy);

      spy.should.have.been.calledTwice;
      spy.should.have.been.calledOn(els);
    });
  });

  describe('#toggle', function() {
    it('should toggle', function() {
      var $el = inst.$('body');
      should.not.exist($el.css('display'));

      $el.toggle();
      $el.css('display').should.equal('none');

      $el.toggle();
      should.not.exist($el.css('display'));
    });
    it('should show', function() {
      var $el = inst.$('body');
      should.not.exist($el.css('display'));

      $el.toggle(true);
      should.not.exist($el.css('display'));
    });
    it('should hide', function() {
      var $el = inst.$('body');
      should.not.exist($el.css('display'));

      $el.toggle(false);
      $el.css('display').should.equal('none');
    });
  });

  describe('#focus', function() {
    it('should apply attr', function() {
      var $el = inst.$('body');
      should.not.exist($el.attr('autofocus'));

      $el.focus();
      $el.attr('autofocus').should.equal('autofocus');

      $el.blur();
      $el.attr('autofocus').should.equal(false);
    });
  });
});
