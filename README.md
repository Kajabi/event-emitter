EventEmitter
============

# TL-DR
A JavaScript library that does node.js-ish event subscription/emission PLUS
- simple unsubscription
- allows subscribing for last event in the past.

This should be a dependable low-level library.
Check out our [test page](https://kajabi.github.io/event-emitter/test.html).


# API

## Subscription interface

### .on(eventName, callback[, count])

#### Subscribe to all future 'my_event' events
    function response(res) {
      console.log('res', res);
    }

    var unsubscribe = eventEmitter.on('my_event', response);

#### Subscribe to 5 future 'my_event' events (and then auto-unsubscribe)
    var unsubscribe = eventEmitter.on('my_event', response, 5);

### .on1(eventName, callback)
alias of `eventEmitter.on(eventName, response, 1)`
#### Subscribe for 1 future 'my_event' event (and then auto-unsubscribe)
    var unsubscribe = eventEmitter.on1('my_event', response);


### .after(eventName, callback[, count])
Allows subscribeing to all future event AND the last past event.

In case the event was called in the past, this will immediately trigger the
callback.

If a `count` limit was added, the immed

#### Subscribe to all future 'my_event' events and last past event emission
    function response(res) {
      console.log('res', res);
    }

    var unsubscribe = eventEmitter.after('my_event', response);

#### Subscribe to future and last past 'my_event' events to a total of 5 callbacks (and then auto-unsubscribe)
    var unsubscribe = eventEmitter.after('my_event', response, 5);

### .on1(eventName, callback)
alias of `eventEmitter.after(eventName, response, 1)`
#### Subscribe for 1 future OR last past 'my_event' event (and then auto-unsubscribe)
    var unsubscribe = eventEmitter.after1('my_event', response);

### .recall(eventName[, callback])
Check if `eventName` has been called before and/or trigger a callback with it.

#### Check if 'my_event' has been called yet
    console.log('`my_event` ' + (eventEmitter.recall('my_event') ? 'has' : 'has NOT') + ' been called');

#### Get argument and scope of last emission for 'my_event'
    var lastEmissionInfo = eventEmitter.recall('my_event');

    if (lastEmissionInfo) {
      console.log('Last call scope:', scope);
      console.log('Last call arguments:', arguments);
    } else {
      console.log('Has not been called yet');
    }

#### Trigger my function IF the event has been called in the past
    eventEmitter.recall('my_event', function (a, b, c) {
      console.log(a, b, c); // only triggers if my_event has been called before
    });

## Unsubscribe
All subscriber methods return an unsubscribe function. Call it any time to unsubscribe from future callbacks.

The unsubscriber function returns `true` unles the unsubscription has already happened
(e.g. maximum allowed callback `count` was reached or the unsubscriber method was called before).

    var unsubscribe = eventEmitter.on('my_event', response);

    setTimeout(function () {
      unsubscribe();
    }, 10000); // unsubscribe in 10 seconds


## Event emission

### .emit(eventName[, argument1[, argument2...]])
Triggers subscribed callbacks and returns the number triggered methods.

Also unsubscribes any callbacks that reached the `count` limit.

    var triggeredCallbackCount = eventEmitter.emit('my_event', arg1, arg2, arg3);

#### Alternate scope for triggered callbacks
This function picks up scope of the `emit` call and passes it to the triggered callbacks.

    var myArray = [1, 2, 3];

    eventEmitter.on('sum_array', function() {
      alert('my last element: ' + this.pop());
    });

    eventEmitter.emit.call(myObject, 'sum_array');

### .flush(eventName[, argument1[, argument2...]])
Combined `emit(eventName, args...)` + `clear(eventName)`

Returns the number of triggered event subscriptions.


### .clear([eventName])
Unsubscribe all subscriptions for `eventName` (if specified) or all subscriptions for all events.

Returns the number of removed subscriptions.

    var nClearedSubscriptions = eventEmitter.clear('my_event');
    // whoever wants to receive events for `my_event` will have to re-subscribe now
