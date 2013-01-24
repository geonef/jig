/**
 * Utilities about deferred, promises and asynchronicity in general
 */
define([
  "require",
  "dojo/_base/Deferred",
  "dojo/_base/lang",
  "dojo/_base/window",
  "dojo/_base/kernel",
  "dojo/promise/all",
], function(require, Deferred, lang, window, kernel, allPromises) {


var self = { //--noindent--

  /**
   * Generate an already-resolved deferred
   *
   * WILL SOON BE OBSOLETE IN FAVOR OF bindArg() with no promise
   *
   * Useful for async-style function which return a sync value.
   * This can be seen as an "async wrapper" for sync values.
   *
   * @return {dojo/Deferred}
   */
  newResolved: function(arg) {
    var deferred = new Deferred();
    deferred.resolve(arg);
    return deferred;
  },

  /**
   * Bind the given arg the the promise and return the new (bound) promise
   *
   * Kind of dojo's lang.hitch().
   * If no promise is given, a new one is created, already resolved.
   *
   * @param {mixed} arg
   * @param {dojo/Deferred} promise
   * @return {dojo/Deferred}
   */
  bindArg: function(arg, promise) {
    if (!promise) {
      promise = new Deferred();
      promise.resolve(arg);
      return promise;
    }
    return promise.then(function() { return arg; });
  },

  newRejected: function(error) {
    var promise = new Deferred();
    promise.reject(error);
    return promise;
  },

  /**
   * Multiplex multiple deferreds
   *
   * TODO: use directly dojo/promise/all
   *
   * @deprecated use dojo's dojo/promise/all instead
   * @return {dojo/Deferred}
   */
  whenAll: function(deferreds) {
    kernel.deprecated("geonef/jig/util/async.whenAll()",
                      "use dojo/promise/all instead");

    return allPromises(deferreds);
  },

  /**
   * @param {Number} delay in milliseconds (arg 2 to dojo/global/setTimeout)
   */
  whenTimeout: function(delay) {
    var def = new Deferred();
    window.global.setTimeout(function() { def.resolve(); }, delay);

    return def;
  },

  /**
   * Test given func until it returns true
   *
   * This can be useful to wait for the DOM to be updated, for example.
   *
   * @param {Function} testFunc test function
   * @param {integer} delay     delay between each test (in milliseconds)
   * @param {integer} timeout   time before giving up (milliseconds)
   * @return {dojo/Deferred}
   */
  whenSatisfied: function(testFunc, delay, timeout) {
    var promise = new Deferred();
    timeout = timeout || 2000;
    delay = delay || 50;
    var count = timeout / delay;
    var checkFunc = function() {
      if (testFunc()) {
        promise.resolve();
      } else {
        --count;
          if (count > 0) {
            window.global.setTimeout(checkFunc, delay || 50);
          } else {
            console.warn("whenSatisfied: timeout has passed: ", timeout, "Giving up.");
          }
      }
    };
    checkFunc();

    return promise;
  },

  /**
   * Create busy effect on node until returned function is called
   *
   * Example:
   *     deferred.then(geonef/jig/util/busy(node))
   *
   * @param {DOMElement} node
   * @return {function} must be called to stop the busy effect
   */
  busy: function(node) {
    var Processing = require("geonef/jig/tool/Processing");
    var control = new Processing({ processingNode: node });
    control.startup();
    return function(arg) {
      control.end();
      return arg;
    };
  },

  /**
   * Return a function which will set its arg to the given obj
   *
   * @param {Object} obj
   * @param {string} name
   * @return {Function}
   */
  setProp: function(obj, propName) {
    return function(arg) {
      obj[propName] = arg;
      return arg;
    };
  },

  /**
   * Wrap call into timeout function
   */
  deferHitch: function(scope, func) {
    var _func = lang.hitch.apply(null, arguments);
    return function() {
      self.whenTimeout(0).then(_func);
    };
  },

  /**
   * Return a function that will return a promise resolved when
   * the given promise is resolved.
   *
   * The promise will be resolved with the argument provided
   * to the function.
   */
  deferWhen: function(promise) {
    return function(arg) {
      return self.bindArg(arg, promise);
    };
  },


};

  return self;

});
