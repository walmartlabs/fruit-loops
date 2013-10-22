var _console = require('../../lib/dom/console');

describe('dom.console', function() {
  var window;
  beforeEach(function() {
    window = {};
  });

  ['log', 'info', 'warn', 'error'].forEach(function(name) {
    describe('#' + name, function() {
      beforeEach(function() {
        this.stub(console, name);
      });

      it('should pass all args', function() {
        _console(window);
        window.console[name]('foo', 1, 'bar');

        console[name].should.have.been.calledOnce;
        console[name].should.have.been.calledOn(console);
        console[name].should.have.been.calledWith('foo', 1, 'bar');
      });
    });
  });
});
