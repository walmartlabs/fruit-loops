var exec = require('../lib/exec'),
    fs = require('fs'),
    sourceMap = require('source-map');

describe('exec', function() {
  beforeEach(function() {
    var self = this;
    this.stub(fs, 'readFileSync', function(name) {
      return name;
    });
    this.stub(sourceMap, 'SourceMapConsumer', function(name) {
      if (/baz/.test(name)) {
        throw new Error();
      }

      this.originalPositionFor = self.spy(function(pos) {
        return {source: 'new' + name, line: pos.line+10, column: pos.column+10};
      });
    });
  });
  afterEach(function() {
    require('../lib/exec/source-map').reset();
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
