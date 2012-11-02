/**
 * Example of asynchronous test
 */
define([
  "dojo/_base/declare",
  "../Asserts",
  "./syncTest",
  "../../util/async",
  "dojo/_base/lang"
], function(declare, Asserts, syncTest, async, lang) {

  "use strict";

return function(test) { //--noindent--
  var assert = new Asserts(test);
  var delay = 2000;

  test.setName("asyncTest");
  assert.isTrue(true, "dumb assert (in asyncTest)");

  return test.group(function installTimeout() {
    assert.isTrue(true, "dumb assert (in installTimeout)");
    return async.whenTimeout(delay);
  })

    .then(function() {
      test.log("okay, now go: handleTimeout");
      return 41;
    })

    .then(test.hitchGroup(function handleTimeout(test, arg) {
      assert.equal(41, arg, "arg==41 (in handleTimeout)");
      return 42;
    }))

    .then(function() {
      test.log("okay, now go: installAndHandleTimeout");
      return 43;
    })

    .then(test.hitchGroup(function installAndHandleTimeout(test, arg) {
      assert.equal(43, arg, "arg==43 (in installTimeout2)");
      return async.whenTimeout(delay).then(function() {
        assert.isTrue(true, "dumb assert (in handleTimeout2)");
        return 44;
      });
    }))

    .then(function(arg) {
      assert.equal(44, arg, "arg==44 (in asyncTest)");
      test.log("okay, now stay in: asyncTest");
      return 45;
    })

    .then(function(arg) {
      assert.equal(45, arg, "dumb assert (in asyncTest)");
      return async.whenTimeout(delay).then(function() {
        assert.isTrue(true, "dumb assert (in asyncTest)");
        return 46;
      });
    })

    .then(function(arg) {
      assert.equal(46, arg, "arg==46 (in asyncTest)");
      test.log("okay, now stay in: asyncTest, then: handleTimeoutOnly");
      return 47;
    })

    .then(function(arg) {
      assert.equal(47, arg, "arg==48 (in asyncTest)");
      return async.whenTimeout(delay)
        .then(test.hitchGroup(function handleTimeoutOnly() {
          assert.isTrue(true, "dumb assert (in handleTimeoutOnly)");
          return 48;
        }));
    })

    .then(function(arg) {
      assert.equal(48, arg, "arg==48 (in asyncTest)");
      test.log("okay, now execute sync tests, in: syncTest");
      test.group(syncTest);
      return 49;
    })
  ;

};

});

