var _console = require('../../lib/dom/console'),
    Exec = require('../../lib/exec');

describe('dom.console', function() {
  var window;
  beforeEach(function() {
    window = {
      FruitLoops: {
        id: 42,
        start: [0,0]
      },
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

      it('should printf', function() {
        _console(window, Exec.create());
        window.console[name]('foo', 1, 'bar');

        console[name].should.have.been.calledOnce;
        console[name].should.have.been.calledOn(console);
        console[name].should.have.been.calledWith('%s %s foo', 'id_42', '1.000000', 1, 'bar');
      });
      it('should pass all args', function() {
        var obj = {};

        _console(window, Exec.create());
        window.console[name]({}, 1, 'bar');

        console[name].should.have.been.calledOnce;
        console[name].should.have.been.calledOn(console);
        console[name].should.have.been.calledWith('id_42', '1.000000', obj, 1, 'bar');
      });
    });
  });
});
