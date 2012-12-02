/**
 * Base class for tests creating a model - fixture-compatible
 */
define([
  "module",
  "dojo/_base/declare",
  "../TestModule",
  "../Asserts",
  "../../data/model",
  "../../data/model/Abstract",
  "dojo/_base/lang",
], function(module, declare, TestModule, Asserts, model, AbstractModel, lang) {

return declare(TestModule, { //--noindent--

  /**
   * Model class
   *
   * @type {geonef/jig/data/model/Abstract}
   */
  Model: AbstractModel,

  /**
   * Properties to set on model object
   *
   * @type {Object}
   */
  data: {},

  /**
   * Model object - created in createNew()
   *
   * @type {geonef/jig/data/model/Abstract}
   */
  object: null,

  /**
   * Model store - set in postMixInProperties()
   *
   * @type {geonef/jig/data/model/ModelStore}
   */
  store: null,

  /**
   * @override
   */
  postMixInProperties: function() {
    this.inherited(arguments);
    this.assert = new Asserts(this.test);
    this.store = model.getStore(this.Model);
  },

  /**
   * @override
   */
  execute: function() {
    var test = this.test;
    return test.group(this, this.createObject)
      .then(test.hitchGroup(this, this.beforeSave))
      .then(test.hitchGroup(this, this.saveObject))
      .then(test.hitchGroup(this, this.afterSave))
      .then(lang.hitch(this, this.runChildTests));
  },

  /**
   * Create the model object and save it
   */
  createObject: function(test) {
    var _this = this;
    var discriminator = null;
    var data = this.makeProperties();
    var discrProp = this.Model.prototype.discriminatorProperty;
    if (discrProp) {
      discriminator = data[discrProp];
      delete data[discrProp];
    }
    console.log("discr", discrProp, discriminator, this);
    return this.store.createObject(discriminator)
      .then(function(object) {
        _this.object = object;
        return object.fromServerValue(data, { setOriginal: false });
      });
  },

  /**
   * Make and return the properties to set on object before save
   */
  makeProperties: function() {
    return lang.mixin({}, this.data);
  },


  /**
   * Check object before save
   */
  beforeSave: function() {
    this.assert.instanceOf(this.Model, this.object,
                           "store.createObject() returns a proper object");
  },

  /**
   * Save model object
   */
  saveObject: function() {
    return this.store.put(this.object);
  },

  /**
   * Check object after save
   */
  afterSave: function() {
    this.assert.isTrue(this.object.id, "saved object has an id");
  },

  declaredClass: module.id

});

});
