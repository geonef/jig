/**
 * Example of synchronous test
 */
define([
  "../Asserts",
], function(Asserts) {

  "use strict";

return function(test) { //--noindent--
  var assert = new Asserts(test);

  test.setName("syncTest");

  test.log("syncTest is starting!");

  test.group(function dumbMessages() {
    test.pass("message de pass");
    test.fail("message de fail");
  });

  test.group(function dumbAssertions() {
    assert.isTrue(42, "42 is true");
    assert.isTrue({}, "empty object is true");
    assert.isTrue([], "empty array is true");
    assert.isFalse(0, "0 is false");
    assert.isFalse(null, "null is false");
    assert.isFalse(false, "false is false");
    assert.equal(42, 42, "42 == 42");
    assert.equal(42, '42', "42 == '42'");
    assert.notEqual(42, 43, "42 != 43");
    assert.notEqual(42, '43', "42 != '43'");
    assert.strictEqual(42, 42, "42 === 42");
    assert.notStrictEqual(42, "42", "42 !== '42'");
    assert.notStrictEqual({}, {}, "{} !== {}");
    assert.match(/^toto/, "toto fait du vélo");
  });

  test.log("rootTest is finishing!");
  return 42;
};

});

