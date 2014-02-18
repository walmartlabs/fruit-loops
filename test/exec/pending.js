var Pending = require('../../lib/exec/pending');

describe('pending exec', function() {
  var pending;
  beforeEach(function() {
    pending = Pending.create();
  });

  it('should init clean', function() {
    pending.pending().should.equal(0);
  });

  it('should push events', function() {
    pending.push('test', 123, function() {});
    pending.pending().should.equal(1);
  });
  describe('#pop', function() {
    it('should pop events', function() {
      pending.push('test', 123, function() {});
      pending.pop('test', 123);
      pending.pending().should.equal(0);
    });
    it('should throw on mismatch', function() {
      pending.push('test', 123, function() {});

      should.throw(function() {
        pending.pop('test', 413);
      }, Error, 'Unbalanced event stack: expected: test:413  found: test:123');
    });
  });

  describe('#cancel', function() {
    it('should cancel events', function() {
      var spy = this.spy();
      pending.push('test', 123, spy);

      pending.cancel('test', 123);
      spy.callCount.should.equal(1);
    });
    it('should throw on not found', function() {
      pending.push('test', 123, function() {});

      should.throw(function() {
        pending.cancel('test', 413);
      }, Error, 'Pending event test:413 not found.');
    });
  });

  it('should reset pending events', function() {
    var spy = this.spy(),
        spy2 = this.spy();
    pending.push('test', 123, spy);
    pending.push('bar', 'baz', spy2);

    pending.reset();
    spy.callCount.should.equal(1);
    spy2.callCount.should.equal(1);
  });
});
