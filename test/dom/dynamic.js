var fruitLoops = require('../../lib'),
    exec = require('../../lib/exec'),
    fs = require('fs'),
    hapi = require('hapi'),
    sinon = require('sinon');

describe('dynamic code exec', function() {
  it('should not allow dynamic code without evil flag', function(done) {
    this.clock.restore();

    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: '/foo',
      index: __dirname + '/../artifacts/dynamic-page.html',
      loaded: function(page) {
        page.emit('events');
      },
      callback: function(err) {
        should.not.exist(err);

        should.not.exist(page.window.evalString);
        page.window.evalThrow.toString().should.match(/SecurityError: dynamic code must be enabled with evil flag/);

        should.not.exist(page.window.fnString);
        page.window.fnThrow.toString().should.match(/SecurityError: dynamic code must be enabled with evil flag/);

        should.not.exist(page.window.timeoutString);
        page.window.timeoutInitThrow.toString().should.match(/SecurityError: dynamic code must be enabled with evil flag/);

        should.not.exist(page.window.fs);
        done();
      }
    });
  });
  it('should scope all dynamic code to the VM', function(done) {
    this.clock.restore();

    var page = fruitLoops.page({
      userAgent: 'anything but android',
      url: '/foo',
      evil: true,
      index: __dirname + '/../artifacts/dynamic-page.html',
      loaded: function(page) {
        page.emit('events');
      },
      callback: function(err) {
        should.not.exist(err);

        page.window.evalString.should.equal('evaled! true');
        page.window.evalThrow.toString().should.match(/ReferenceError: require is not defined/);

        page.window.fnString.should.equal('fned! true');
        page.window.fnThrow.toString().should.match(/ReferenceError: require is not defined/);

        page.window.timeoutString.should.equal('timeouted! true');
        page.window.timeoutThrow.toString().should.match(/ReferenceError: require is not defined/);

        should.not.exist(page.window.fs);
        done();
      }
    });
  });
});
