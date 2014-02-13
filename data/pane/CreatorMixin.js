define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/Deferred",
], function(module, declare, lang, Deferred) {


return declare(null, { //--noindent--

  /**
   * Default options to pass to server at createNew(). (ie. 'factory')
   *
   * @type {Object}
   */
  createOptions: null,

  /**
   * Default properties to set the new object with
   *
   * @type {Object}
   */
  defaultProperties: null,

  /**
   * @type {geonef/jig/data/model/ModelStore}
   */
  store: null,

  /**
   * Calls createNew() with properties set using this.filter*
   *
   * Useful for {geonef/jig/data/list/Basic} widgets to create
   */
  createFromFilter: function(discriminatorKey) {
    var props = {};
    for (var name in this.filter) if (this.filter.hasOwnProperty(name)) {
      var filter = this.filter;
      if (!filter || !filter.op) {
        props[name] = filter;
      }
    }
    this.createNew(props);
  },

  /**
   * Create a new object and save it (function to be called from UI)
   *
   * Warning: don't use it directly as an event handler
   *          (the event obj would be got as 'props')
   *
   * @public
   * @param {!Object} props     Properties to init the model object with
   * @param {!Object} options   Options to the store's add() operation
   * @param {string} discriminatorKey The discriminator to use, if used on that Model
   * @return {dojo/Deferred}
   */
  createNew: function(props, options, discriminatorKey) {
    var _this = this;
    options = lang.mixin({}, this.createOptions, options);
    return this.createNewObject(props, discriminatorKey)
      .then(function(obj) {
        if (!obj) { return false; }
        return _this.store.add(obj, options)
          .then(function(obj) {
            if (obj && obj.getId()) {
              _this.afterCreateNew(obj);
            }
          });
      });
  },

  /**
   * Create new object with given properties - asynchronous (to be overloaded if needed)
   *
   * @protected
   * @param {!Object} props     Properties to init the model object with
   * @param {string} discriminatorKey The discriminator to use, if used on that Model
   * @return {geonef/jig/Deferred}
   */
  createNewObject: function(props, discriminatorKey) {
    var _this = this;
    return this.store.createObject(discriminatorKey)
      .then(function(object) {
        object.setProps(_this.defaultProperties);
        object.setProps(props);
        return object;
      });
  },

  /**
   * hook - called after a new object has been saved
   *
   * @param {geonef/jig/data/model/Abstract} object object which has been created
   */
  afterCreateNew: function(object) {},

  declaredClass: module.id

});

});
