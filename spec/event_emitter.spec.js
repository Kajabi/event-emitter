
describe('EventEmitter', function() {

  var emitter;

  beforeEach(function () {
    emitter = new EventEmitter();
  });


  describe('construction and API', function() {

    it('instanciates and provides frozen API', function() {
      emitter.on.should.be.a('function');
      emitter.on1.should.be.a('function');
      emitter.after.should.be.a('function');
      emitter.after1.should.be.a('function');

      emitter.clear.should.be.a('function');
      emitter.emit.should.be.a('function');
      emitter.flush.should.be.a('function');
      emitter.recall.should.be.a('function');

      var key,
          count = 0;
      for (key in emitter) {
        count += 1;
      }
      count.should.equal(8); // API has the 7 functions (above) only

      Object.isFrozen(emitter).should.equal(true); // API is frozen
    });

    it('decorates optionally provided object with subscriber methods', function () {
      var obj = {};

      emitter = new EventEmitter(obj);

      obj.on.should.be.a('function');
      obj.on1.should.be.a('function');
      obj.after.should.be.a('function');
      obj.after1.should.be.a('function');
      obj.recall.should.be.a('function');

      var key,
          count = 0;
      for (key in obj) {
        count += 1;
      }
      count.should.equal(5); // has only the 4 subscriber methods
    });
  });


  function signatureArgumentCount(fn, count) {
    return function() {
      if (count === 2) {
        (function () { emitter[fn]('x', function () {}, 1); }).should.throw();
      } else {
        (function () { emitter[fn]('x', function () {}, 1, 2); }).should.throw();
      }
    };
  }


  describe('subscription', function () {

    function signatureEventName(fn) {
      return function() {
        (function () { emitter[fn](1, function () {}); }).should.throw();
        (function () { emitter[fn]('', function () {}); }).should.throw();
      };
    }

    function signatureCallback(fn) {
      return function() {
        (function () { emitter[fn]('x', 1); }).should.throw();
      };
    }

    function signatureCount(fn) {
      return function() {
        (function () { emitter[fn]('x', function () {}, false); }).should.throw();
        (function () { emitter[fn]('x', function () {}, 0); }).should.throw();
        (function () { emitter[fn]('x', function () {}, 12.5); }).should.throw();
        (function () { emitter[fn]('x', function () {}, -1); }).should.throw();
        (function () { emitter[fn]('x', function () {}); }).should.not.throw();
        (function () { emitter[fn]('x', function () {}, 1); }).should.not.throw();
        (function () { emitter[fn]('x', function () {}, 12); }).should.not.throw();
      };
    }


    describe('.on(eventName, callback[, count])', function () {

      it('throws unless argumentCount is 2 .. 3',
         signatureArgumentCount('on', 3));

      it('throws unless `eventName` is a non-empty string',
         signatureEventName('on'));

      it('throws unless `callback` is a function',
         signatureCallback('on'));

      it('accepts undefined, null or int>=1 for `count`',
         signatureCount('on'));


      it('subscribes to future events', function() {
        var increment = 0;

        emitter.emit('my_event', 1);

        emitter.on('my_event', function(n) {
          increment += n;
        });

        increment.should.equal(0); // not triggered by/at subscription

        emitter.emit('other_event', 1);
        increment.should.equal(0); // not triggered by other_event

        emitter.emit('my_event', 1);
        increment.should.equal(1); // triggered by other_event

        emitter.emit('my_event', 9);
        increment.should.equal(10); // triggered once again
      });


      it('count (if passed) triggers unsubscription when reached', function() {
        var increment = 0;

        emitter.on('my_event', function(n) {
          increment += n;
        }, 2);

        emitter.emit('my_event', 1);
        emitter.emit('my_event', 1);
        emitter.emit('my_event', 1);

        increment.should.equal(2); // only called twice
      });


      it('unsubscribes by returned function', function() {
        var unsubscribe,
            increment = 0;

        unsubscribe = emitter.on('my_event', function(n) {
          increment += n;
        });
        unsubscribe.should.be.a('function');

        emitter.emit('my_event', 1);
        increment.should.equal(1); // triggered by other_event

        unsubscribe().should.equal(true); // returns true if it was subscribed

        emitter.emit('my_event', 2);
        increment.should.equal(1); // not triggered this time

        unsubscribe().should.equal(false); // returns false as it was subscribed
      });

    });


    describe('.on1(eventName, callback)', function () {

      it('throws unless argumentCount is 2',
         signatureArgumentCount('on1', 2));

      it('throws unless `eventName` is a non-empty string',
         signatureEventName('on1'));

      it('throws unless `callback` is a function',
         signatureCallback('on1'));


      it('is an alias to .on(eventName, callback, 1)', function() {
        var increment = 0;

        emitter.on1('my_event', function(n) {
          increment += n;
        });

        emitter.emit('my_event', 1);
        emitter.emit('my_event', 1);
        emitter.emit('my_event', 1);

        increment.should.equal(1); // only called twice
      });

    });


    describe('.after(eventName, callback[, count])', function () {

      it('throws unless argumentCount is 2 .. 3',
         signatureArgumentCount('after', 3));

      it('throws unless `eventName` is a non-empty string',
         signatureEventName('after'));

      it('throws unless `callback` is a function',
         signatureCallback('after'));

      it('accepts undefined, null or int>=1 for `count`',
         signatureCount('after'));


      it('subscribes to future events and last past event', function() {
        var increment = 0;

        emitter.emit('my_event', 1);
        emitter.emit('my_event', 2); // this argument is going to be passed

        emitter.after('my_event', function(n) {
          increment += n;
        });

        increment.should.equal(2); // not triggered by/at subscription

        emitter.emit('my_event', 1);
        increment.should.equal(3); // triggered by other_event

        emitter.emit('my_event', 9);
        increment.should.equal(12); // triggered once again
      });


      it('same as .on(...) if there was no past event', function() {
        var increment = 0;

        emitter.after('my_event', function(n) {
          increment += n;
        });

        increment.should.equal(0); // not triggered by/at subscription

        emitter.emit('my_event', 1);
        increment.should.equal(1); // triggered by other_event

        emitter.emit('my_event', 9);
        increment.should.equal(10); // triggered once again
      });


      it('count (if passed) triggers unsubscription when reached', function() {
        var increment = 0;

        emitter.emit('my_event', 1); // last call is included in the count

        emitter.after('my_event', function(n) {
          increment += n;
        }, 3);

        emitter.emit('my_event', 1);
        emitter.emit('my_event', 1);
        emitter.emit('my_event', 1);

        increment.should.equal(3); // only called 1 + 2 times (instead of 1 + 3)
      });


      it('unsubscribes by returned function', function() {
        var unsubscribe,
            increment = 0;

        unsubscribe = emitter.after('my_event', function(n) {
          increment += n;
        });
        unsubscribe.should.be.a('function');

        emitter.emit('my_event', 1);
        increment.should.equal(1); // triggered by other_event

        unsubscribe().should.equal(true); // returns true if it was subscribed

        emitter.emit('my_event', 2);
        increment.should.equal(1); // not triggered this time

        unsubscribe().should.equal(false); // returns false as it was subscribed
      });

    });


    describe('.after1(eventName, callback)', function () {

      it('throws unless argumentCount is 2',
         signatureArgumentCount('after1', 2));

      it('throws unless `eventName` is a non-empty string',
         signatureEventName('after1'));

      it('throws unless `callback` is a function',
         signatureCallback('after1'));


      it('is an alias to .after(eventName, callback, 1)', function() {
        var increment = 0;

        emitter.on1('my_event', function(n) {
          increment += n;
        });

        emitter.emit('my_event', 1);
        emitter.emit('my_event', 1);
        emitter.emit('my_event', 1);

        increment.should.equal(1); // only called once
      });


      it('calls back immediately if event has been emitted before', function() {
        var increment = 0;

        emitter.emit('my_event', 1);

        emitter.after1('my_event', function(n) {
          increment += n;
        });

        increment.should.equal(1); // only called once

        emitter.emit('my_event', 1);

        increment.should.equal(1); // was not triggered
      });


      it('returns empty unsubscriber even if immediately fired', function() {

        emitter.emit('my_event', 1);

        var unsubscribe = emitter.after1('my_event', function() {});

        unsubscribe().should.equal(false);
      });

    });

  });


  describe('.emit(eventName[, cb_arg1, cb_arg2, ...])', function () {

    it('fires callbacks and returns number of calls', function () {
      var increment = 0;

      function count(n) {
        increment += n;
      }

      emitter.on('my_event', count);
      emitter.on('my_event', count, 2);
      emitter.on1('my_event', count);
      emitter.after('my_event', count);
      emitter.after('my_event', count, 2);
      emitter.after1('my_event', count);

      emitter.emit('my_event', 1).should.equal(6);
      increment.should.equal(6);

      emitter.emit('my_event', 1).should.equal(4);
      increment.should.equal(10);

      emitter.emit('my_event', 1).should.equal(2);
      increment.should.equal(12);

      emitter.emit('my_event', 1).should.equal(2);
      increment.should.equal(14);
    });

    it('works with no arguments', function () {
      var args   = null,
          called = false;

      emitter.on('my_event', function () {
        args   = arguments;
        called = true;
      });

      emitter.flush('my_event');
      called.should.equal(true);
      args.length.should.equal(0);
    });

    it('works with many arguments', function () {
      var args   = null,
          called = false;

      emitter.on('my_event', function () {
        args   = arguments;
        called = true;
      });

      emitter.flush('my_event', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
      called.should.equal(true);
      args.length.should.equal(10);
      args[0].should.equal(0);
      args[1].should.equal(1);
      args[5].should.equal(5);
      args[9].should.equal(9);
    });

  });


  describe('.flush(eventName[, cb_arg1, cb_arg2, ...])', function () {

    it('fires callbacks and clears subscriptions', function () {
      var increment = 0;

      function count(n) {
        increment += n;
      }

      emitter.on('my_event', count);
      emitter.on('my_event', count, 2);
      emitter.on1('my_event', count);
      emitter.after('my_event', count);
      emitter.after('my_event', count, 2);
      emitter.after1('my_event', count);

      emitter.flush('my_event', 1).should.equal(6);
      increment.should.equal(6);

      emitter.emit('my_event', 1).should.equal(0);
      increment.should.equal(6);
    });

  });


  describe('.clear(eventName)', function () {

    it('throws unless argumentCount is 1',
       signatureArgumentCount('clear', 1));

    it('clears subscriptions', function () {
      var increment = 0;

      function count(n) {
        increment += n;
      }

      emitter.on('my_event', count);
      emitter.on('my_event', count, 2);
      emitter.on1('my_event', count);
      emitter.after('my_event', count);
      emitter.after('my_event', count, 2);
      emitter.after1('my_event', count);

      emitter.emit('my_event', 1).should.equal(6);
      increment.should.equal(6);

      emitter.clear('my_event').should.equal(4);
      increment.should.equal(6);

      emitter.emit('my_event', 1).should.equal(0);
      increment.should.equal(6);
    });

    it('clears for .recall() too', function () {
      function shouldNotBeCalled() {
        throw new Error('should not have called this');
      }

      emitter.emit('my_event');

      emitter.clear('my_event');

      emitter.recall('my_event').should.equal(false);
    });

  });


  describe('.recall(eventName[, callback])', function () {

    it('throws unless argumentCount is 1',
       signatureArgumentCount('recall', 1));

    it('returns arguments and scope of last event emission', function () {
      var lastCall,
          obj = {xx: 1};

      emitter.emit.call(obj, 'my_event', 1, 2, 3);
      lastCall = emitter.recall('my_event');

      lastCall.arguments.length.should.equal(3);
      lastCall.arguments[0].should.equal(1);
      lastCall.arguments[1].should.equal(2);
      lastCall.arguments[2].should.equal(3);
      lastCall.scope.should.equal(obj);
    });

    it('returns false if event has not been called yet', function () {
      emitter.recall('my_event').should.equal(false);

      emitter.emit('my_event', 1, 2, 3);
      emitter.recall('my_event').should.be.a('object');
    });

    it('fires the callback if event has been called', function () {
      var called = false,
          obj    = {aa: 22};

      emitter.emit.call(obj, 'my_event', 1, 2, 3);

      emitter.recall('my_event', function(a, b, c) {
        called = true;
        this.should.equal(obj);
        a.should.equal(1);
        b.should.equal(2);
        c.should.equal(3);
        arguments.length.should.equal(3);
      }).should.be.a('object');

      called.should.equal(true);
    });

    it('does not fire the callback unless event has been called', function () {
      var called = false;

      emitter.recall('my_event', function() {
        called = true;
      }).should.equal(false);

      called.should.equal(false);
    });

  });

});
