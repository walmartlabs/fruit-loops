setImmediate(function() {
  throw new Error('shouldnt run either');
}, 10);


this.location = '/foo';

throw new Error('should not have run');
