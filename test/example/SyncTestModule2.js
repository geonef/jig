/**
 * Example of dumb test module
 *
 */
define([
  "module",
  "dojo/_base/declare",
  "../TestModule",
  "../Asserts",
  "dojo/_base/lang"
], function(module, declare, TestModule, Asserts, lang) {

return declare(TestModule, { //--noindent--

  /**
   * Test property
   */
  prop1: null,

  /**
   * @override
   */
  postMixInProperties: function() {
    this.inherited(arguments);
    this.assert = new Asserts(this.test);
  },

  /**
   * @override
   */
  execute: function() {
    this.assert.isTrue(true, "dumb assert (in execute)");
    this.assert.strictEqual(42, this.prop1, "this.prop1 === 42");
  },

  /**
   * @override
   */
  declaredClass: module.id

});

});

