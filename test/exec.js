var Exec = require('../lib/exec'),
    fs = require('fs'),
    sourceMap = require('source-map');

describe('exec', function() {
  var exec,
      globalHandler;
  beforeEach(function() {
    var self = this;
    globalHandler = this.spy(function(err)  { throw err; });
    exec = Exec.create(globalHandler);
    exec.debug = false;

    this.stub(fs, 'readFileSync', function(name) {
      if (/^new/.test(name)) {
        return 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
      } else {
        return name;
      }
    });
    this.stub(sourceMap, 'SourceMapConsumer', function(name) {
      if (/baz/.test(name)) {
        throw new Error();
      }

      this.originalPositionFor = self.spy(function(pos) {
        if (/exec.js/.test(name)) {
          return {source: 'new' + name, line: 2, column: pos.column+10};
        } else {
          return {source: 'new' + name, line: pos.line+10, column: pos.column+10};
        }
      });
    });
  });

  describe('#exec', function() {
    it('should include error context', function(done) {
      try {
        exec.exec(function() {
          throw new Error();
        });
      } catch (err) {
        err.stack.should.match(/\t     1:  Line 1\n\t     2:> Line 2\n\t     3:  Line 3\n\t     4:  Line 4\n\t     5:  Line 5\n\n/);
        globalHandler.should.have.been.calledOnce;
        done();
      }
    });

    it('should pass to error handler', function(done) {
      exec.exec(function() {
        throw new Error();
      }, function(err) {
        err.stack.should.match(/\t     1:  Line 1\n\t     2:> Line 2\n\t     3:  Line 3\n\t     4:  Line 4\n\t     5:  Line 5\n\n/);
        globalHandler.should.not.have.been.called;
        done();
      });
    });

    it('should handle error in error handler', function(done) {
      try {
        exec.exec(function() {
          throw new Error();
        }, function(err) {
          throw new Error('Foo');
        });
      } catch (err) {
        err.should.match(/Foo/);
        globalHandler.should.have.been.calledOnce;
        done();
      }
    });

    it('should rewriteStack', function() {
      try {
        exec.exec(function() {
          throw new Error();
        });
      } catch (err) {
        err.stack.should.match(/at \(new.*?exec.js.map.*?\)\n  at \(native\)\n/);
      }
    });
    it('should rewriteStack once', function() {
      try {
        exec.exec(function() {
          exec.exec(function() {
            throw new Error();
          });
        });
      } catch (err) {
        err.stack.should.match(/at \(new.*?exec.js.map.*?\)\n  at \(native\)\n/);
      }
    });

    it('should leave invalid stacks untouched', function() {
      sourceMap.SourceMapConsumer.restore();
      try {
        exec.exec(function() {
          var error = new Error();
          error.stack = 'foo';
          throw error;
        });
      } catch (err) {
        err.stack.should.equal('foo');
      }
    });
  });

  describe('#processError', function() {
    it('should remap matched lines', function() {
      var err = new Error('Foo');
      err.stack = 'Foo\n'
          + ' at functionName (foo/bar:10:20)\n'
          + ' at foo/fruit-loops/lib/bar\n'
          + ' at foo/fruit-loops/lib/bak\n'
          + ' at baz/bat\n';

      err = exec.processError(err);
      err.message.should.equal('Foo\n\n');
      err.clientProcessed.should.be.true;
      err.stack.should.equal(
          'Foo\n\n'
          + '  at functionName (newfoo/bar.map:20:30)\n'
          + '  at (native)\n'
          + '  at (baz/bat)\n');

      fs.readFileSync.should
          .have.been.calledWith('foo/bar.map')
          .have.been.calledWith('baz/bat.map');
    });
  });

  describe('#rewriteStack', function() {
    it('should remap matched lines', function() {
      exec.rewriteStack(
          'Foo\n'
          + ' at functionName (foo/bar:10:20)\n'
          + ' at foo/fruit-loops/lib/bar\n'
          + ' at foo/fruit-loops/lib/bak\n'
          + ' at baz/bat\n'
        ).should.equal(
          'Foo\n'
          + '  at functionName (newfoo/bar.map:20:30)\n'
          + '  at (native)\n'
          + '  at (baz/bat)\n');

      fs.readFileSync.should
          .have.been.calledWith('foo/bar.map')
          .have.been.calledWith('baz/bat.map');
    });

    it('should handle array input', function() {
      exec.rewriteStack([
          'Foo',
          ' at functionName (foo/bar:10:20)',
          ' at foo/fruit-loops/lib/bar',
          ' at foo/fruit-loops/lib/bak',
          ' at baz/bat'
        ]).should.equal(
          'Foo\n'
          + '  at functionName (newfoo/bar.map:20:30)\n'
          + '  at (native)\n'
          + '  at (baz/bat)\n');

      fs.readFileSync.should
          .have.been.calledWith('foo/bar.map')
          .have.been.calledWith('baz/bat.map');
    });
  });
});
