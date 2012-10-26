/**
 * Test assertions
 */
define([
  "module",
  "dojo/_base/declare",
], function(module, declare) {

  "use strict";

return declare(null, { //--noindent--

  constructor: function(test) {
    this.test = test;
  },

  isTrue: function(bool, message) {
    return this.passOrFail(bool, ["assert isTrue", message]);
  },

  isFalse: function(bool, message) {
    return this.passOrFail(!bool, ["assert isFalse", message]);
  },

  equal: function(obj1, obj2, message) {
    return this.passOrFail(obj1 == obj2, ["assert equal", message]);
  },

  notEqual: function(obj1, obj2, message) {
    return this.passOrFail(obj1 != obj2, ["assert notEqual", message]);
  },

  strictEqual: function(obj1, obj2, message) {
    return this.passOrFail(obj1 === obj2,
                           ["assert strictEqual", message, obj1, obj2]);
  },

  notStrictEqual: function(obj1, obj2, message) {
    return this.passOrFail(obj1 !== obj2,
                           ["assert notStrictEqual", message, obj1, obj2]);
  },

    instanceOf: function(_class, obj, message) {
      return this.passOrFail(
        obj instanceof _class,
        ["assert instanceOf "+
         (_class.name ||
          _class.prototype.declaredClass ||
          _class.prototype.CLASS_NAME), message, obj]);
    },

  match: function(re, value, message) {
    var match = re.test(value);
    return this.passOrFail(match, "regexp "+re+" matches \""+value+"\"", message);
  },

  passOrFail: function(state, messages) {
    if (messages  instanceof Array) {
      if (state) {
        messages = messages.slice(0, 2);
      }
      messages = messages.join(" ~ ");
    }
    if (state) {
      this.test.pass(messages);
    } else {
      this.test.fail(messages);
    }
    return state;
  },

  /**
   * The Class name comes from module's -- used by declare()
   */
  declaredClass: module.id

});

});

