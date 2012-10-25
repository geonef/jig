/**
 * Example of asynchronous test module
 *
 */
define([
  "module",
  "dojo/_base/declare",
  "../TestModule",
  "../Asserts",
  "./SyncTestModule1",
  "./SyncTestModule2",
], function(module, declare, TestModule, Asserts, SyncTestModule1, SyncTestModule2) {

return declare(TestModule, { //--noindent--

  childTests: [
    /**
     * Form1: real class, no options
     */
    SyncTestModule1,

    /**
     * Form2: real class with options
     */
    { "class": SyncTestModule2, prop1: 42 },

    /**
     * Form3: class module ID, no options
     */
    "geonef/jig/test/example/SyncTestModule3",

    /**
     * Form4: class module ID with options
     */
    { "class": "geonef/jig/test/example/SyncTestModule4", prop1: 43 },
  ],

  postMixInProperties: function() {
    this.inherited(arguments);
    this.assert = new Asserts(this.test);
  },

  execute: function() {
    this.assert.isTrue(true, "dumb assert (in execute)");
    return this.inherited(arguments);
  },

  declaredClass: module.id

});

});

