var _console = require('../../lib/dom/console'),
    Exec = require('../../lib/exec');

describe('dom.console', function() {
  var window;
  beforeEach(function() {
    window = {
      _id: 42,
      _start: [0,0]
    };
  });

  ['log', 'info', 'warn', 'error'].forEach(function(name) {
    describe('#' + name, function() {
      beforeEach(function() {
        this.stub(console, name);
        this.stub(process, 'hrtime', function(start) {
          return [1e6-start[0], 1e6-start[1]];
        });
      });

      it('should pass all args', function() {
        _console(window, Exec.create());
        window.console[name]('foo', 1, 'bar');

        console[name].should.have.been.calledOnce;
        console[name].should.have.been.calledOn(console);
        console[name].should.have.been.calledWith('id_42', 1, 'foo', 1, 'bar');
      });
    });
  });
});
