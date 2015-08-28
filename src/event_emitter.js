
function EventEmitter(decoratableObject) {

  var _self       = this,
      cue         = {},
      flushArgs   = {},
      flushScope  = {},
      incrementId = 1;


  this.clear = function (eventName) {
    signatureCheck(arguments, 1);

    var eventCue  = getEventCue(eventName),
        cueLength = eventCue.length;

    delete flushArgs[eventName];
    delete flushScope[eventName];

    while (eventCue.pop()) { } // empty cue

    return cueLength;
  };

  this.emit = function (eventName) {
    signatureCheck(arguments);

    var i, inf, cueLength,
        args     = Array.prototype.slice.call(arguments, 1),
        eventCue = getEventCue(eventName),
        count    = eventCue.length;

    flushArgs[eventName]  = args;
    flushScope[eventName] = this;

    for (i = 0, cueLength = eventCue.length; i < cueLength; i += 1) {
      inf = eventCue[i];

      if (inf.count === 1) {
        inf.unsubscribe();
        i -= 1;
        cueLength -= 1;
      } else if (inf.count) {
        inf.count -= 1;
      }

      inf.callback.apply(this, args);
    }

    return count;
  };

  this.flush = function (eventName) {
    var count = _self.emit.apply(this, Array.prototype.slice.call(arguments));
    _self.clear(eventName);
    return count;
  };

  this.recall = function (eventName, callback) {
    signatureCheck(arguments, 2, 1);

    if (flushArgs[eventName]) {
      if (callback) {
        callback.apply(flushScope[eventName], flushArgs[eventName]);
      }

      return {
        arguments: flushArgs[eventName].slice(),
        scope: flushScope[eventName]
      };
    }

    return false;
  };

  this.on = function (eventName, callback, count) {
    count = signatureCheck(arguments, 3);

    var inf = {
      id:          incrementId,
      callback:    callback,
      count:       count,
      unsubscribe: unsubscriberFactory(eventName, incrementId)
    };

    getEventCue(eventName).push(inf);

    incrementId += 1;

    return inf.unsubscribe;
  };

  this.on1 = function (eventName, callback) {
    signatureCheck(arguments, 2);
    return _self.on(eventName, callback, 1);
  };

  this.after = function (eventName, callback, count) {
    count = signatureCheck(arguments, 3);

    if (_self.recall(eventName, callback)) {
      if (count === 1) {
        return unsubscriberFactory(); // empty unsubscriber
      }
      if (count > 0) {
        count -= 1;
      }
    }

    return _self.on(eventName, callback, count);
  };

  this.after1 = function (eventName, callback) {
    signatureCheck(arguments, 2);
    return _self.after(eventName, callback, 1);
  };


  if (decoratableObject && typeof decoratableObject === 'object') {
    decoratableObject.on     = this.on;
    decoratableObject.on1    = this.on1;
    decoratableObject.after  = this.after;
    decoratableObject.after1 = this.after1;
    decoratableObject.recall = this.recall;
  }

  Object.freeze(this);


  // private

  function getEventCue(eventName) {
    if (!cue[eventName]) {
      return (cue[eventName] = []);
    } else {
      return cue[eventName];
    }
  }

  function signatureCheck(args, maxArgCount, minArgCount) {
    minArgCount = minArgCount || maxArgCount;

    if (maxArgCount && args.length > maxArgCount) {
      throw new Error('Too many arguments (' + maxArgCount + ' allowed)');
    }

    if (typeof args[0] !== 'string' || !args[0].length) { // eventName
      throw new Error('`eventName` must be a non-empty string');
    }

    if (minArgCount > 1 && typeof args[1] !== 'function') { // callback
      throw new Error('`callback` must be a function');
    }

    if (minArgCount > 2 && args[2] !== null && typeof args[2] !== 'undefined') {
      if (typeof args[2] !== 'number' || args[2] < 1 ||
          args[2] !== parseInt(args[2], 10)) {
        throw new Error('`count` must be null, undefined or integer >= 0');
      }
    }

    return args[2];
  }

  function unsubscriberFactory(eventName, subscriptionId) {
    return function unsubscribe() {
      if (!subscriptionId) {
        return false;
      }

      var i,
          eventCue = getEventCue(eventName);

      for (i = eventCue.length - 1; i >= 0; i -= 1) {
        if (eventCue[i].id === subscriptionId) {
          eventCue.splice(i, 1);
          return true;
        }
      }

      return false;
    };
  }
}
