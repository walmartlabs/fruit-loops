var Pending = require('../../lib/exec/pending');

describe('pending exec', function() {
  var pending,
      popSpy;
  beforeEach(function() {
    popSpy = this.spy();
    pending = Pending.create();
    pending.on('pop', popSpy);
  });

  it('should init clean', function() {
    pending.pending().should.equal(0);
    pending.log().should.eql([]);
  });

  describe('#push', function() {
    it('should push events', function() {
      pending.push('test', 123, function() {});
      pending.pending().should.equal(1);
      pending.log().should.eql([
        {
          type: 'test',
          id: 123,
          start: 10
        }
      ]);
    });
    it('should push without log', function() {
      pending.push('test', 123, function() {}, true);
      pending.pending().should.equal(1);
      pending.log().should.eql([]);
    });
  });
  describe('#pop', function() {
    it('should pop events', function() {
      pending.push('test', 123, function() {});
      this.clock.tick(10);
      pending.pop('test', 123);
      pending.pending().should.equal(0);
      pending.log().should.eql([
        {
          type: 'test',
          id: 123,
          start: 10,
          duration: 10
        }
      ]);
      popSpy.should.have.been.calledOnce;
    });
    it('should pop events with log data', function() {
      pending.push('test', 123, function() {});
      pending.pop('test', 123, {foo: 'bar'});
      pending.log().should.eql([
        {
          type: 'test',
          id: 123,
          start: 10,
          duration: 0,
          foo: 'bar'
        }
      ]);
    });
    it('should not throw on not found', function() {
      pending.push('test', 123, function() {});

      pending.pop('test', 413);
      popSpy.should.not.have.been.called;
    });
  });

  describe('#cancel', function() {
    it('should cancel events', function() {
      var spy = this.spy();
      pending.push('test', 123, spy);

      pending.cancel('test', 123);
      pending.log().should.eql([
        {
          type: 'test',
          id: 123,
          start: 10,
          duration: 0,
          cancelled: true
        }
      ]);
      spy.callCount.should.equal(1);
      popSpy.should.have.been.calledOnce;
    });
    it('should cancel events with log data', function() {
      var spy = this.spy();
      pending.push('test', 123, spy);

      pending.cancel('test', 123, {foo: 'bar'});
      pending.log().should.eql([
        {
          type: 'test',
          id: 123,
          start: 10,
          duration: 0,
          foo: 'bar',
          cancelled: true
        }
      ]);
      spy.callCount.should.equal(1);
      popSpy.should.have.been.calledOnce;
    });
    it('should not throw on not found', function() {
      pending.push('test', 123, function() {});

      pending.cancel('test', 413);
      popSpy.should.not.have.been.called;
    });
  });

  describe('#wrap', function() {
    it('should provide exec method', function() {
      var spy = this.spy();

      var wrap = pending.wrap('test', 123, spy);
      spy.should.not.have.been.called;

      wrap();
      spy.should.have.been.calledOnce;
    });
    it('should prevent exec on cancel', function() {
      var spy = this.spy();

      var wrap = pending.wrap('test', 123, spy);
      spy.should.not.have.been.called;

      pending.cancel('test', 123);

      wrap();
      spy.should.not.have.been.called;
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
    popSpy.should.not.have.been.called;
  });
});
