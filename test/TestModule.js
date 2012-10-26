/**
 * Base class for test modules of the Geonef test framework
 *
 * This class provides the ability to run sub-group tests sequentially,
 * as describe through the 'tests' property.
 */
define([
  "module",
  "require",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/when",
  "dojo/Deferred",
  "geonef/jig/util/value",
], function(module, require, declare, lang, when, Deferred, valueUtils) {

return declare(null, { //--noindent--

  /**
   * Runner of the test
   *
   * @type {geonef/jig/test/Runner}
   */
  test: null,

  /**
   * Array of sub-tests to execute
   *
   * Items can be functions or AMD module IDs (string)
   *
   * @type {Array.<mixed>}
   */
  childTests: [],

  /**
   * Default constructor
   */
  constructor: function(test, options) {
    this.test = test;
    lang.mixin(this, options);
    this.postMixInProperties();
  },

  /**
   * postMixinProperties
   */
  postMixInProperties: function() {
  },

  /**
   * Execute the test module
   */
  execute: function() {
    return this.runChildTests();
  },

  /**
   * Execute child tests sequentially, (one-by-one),
   * each receiving the value returned by the previous
   *
   * @return {mixed} return value of last test execution, or promise if at
   *                    least one test has returned a promise
   */
  runChildTests: function() {
    var _this = this;
    var tests = this.childTests;
    var options = this.getChildrenOptions();

    if (typeof tests === "object") {
      tests = [];
      for (var key in this.childTests) {
        var test = this.childTests[key];
        if (!test.name) {
          test.name = key;
        }
        tests.push(test);
      }
    }

    return tests.reduce(function(prev, child) {
      return when(prev, lang.hitch(_this, _this.runChildTest, child, options));
    }, undefined);
  },

  /**
   * Run the given child test
   *
   * 'childTest' is flexible, depending on the type:
   * - function: the given class is executed as a test class
   * - string: the given module is loaded and executed as a test class
   * - object: the 'class' property tells the test class, and object is
   *           given as constructor options.
   *
   * @param {mixed} childTest
   * @param {!Object} options
   * @return {mixed} return value of child test, or promise is it's async
   */
  runChildTest: function(childTest, options) {
    var _this = this;

    if (typeof childTest === "object") {
      options = lang.mixin({}, childTest, options);
      childTest = options["class"];
      delete options["class"];
    }

    if (typeof childTest === "string") {
      var deferred = new Deferred();
      require([childTest], lang.hitch(deferred, deferred.resolve));
      return deferred.then(function(ChildTest) {
        return _this.test.classGroup(ChildTest, options);
      });
    } else {
      return this.test.classGroup(childTest, options);
    }
  },

  getChildrenOptions: function() {
    return {};
  },


  /**
   * Destroy function
   */
  destroy: function() {
  },

  declaredClass: module.id

});

});
