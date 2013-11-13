/**
 * Global model manager (singleton)
 *
 * Here are the explanations of how the client model works.
 *
 * A model is basically a class inheriting from 'geonef/jig/data/mode/Abstract'.
 * It contains all information, including: property names & types, the publish
 * channel and business methods.
 *
 * A model as a collection (a "store") is implemented in
 * 'geonef/jig/data/model/ModelStore'. That will read information about the model
 * from the model class (based on 'geonef/jig/data/mode/Abstract').
 *
 * If need be, a model can have a custom store: it has to inherit from
 * 'geonef/jig/data/model/ModelStore' and be specified in the model's 'Store'
 * property (as a class).
 *
 * The store object is the start point to make any operation on the model
 * (query, find, save, delete). See 'geonef/jig/data/model/ModelStore' for
 * documentation.
 *
 * @see geonef/jig/data/model/ModelStore
 * @see geonef/jig/data/model/Abstract
 */
define([
  "./model/ModelStore",
  "dojo/_base/lang"
], function(ModelStore, lang) {


var self = { //--noindent--

  _stores: {},

  /**
   * Get store for corresponding model
   *
   * @param {geonef/jig/data/model/Abstract} Model
   * @return {geonef/jig/data/model/ModelStore}
   */
  getStore: function(Model) {
    var stores = self._stores;
    var classId = Model.prototype.declaredClass;
    if (!stores[classId]) {
      var options = { Model: Model, id: "store:"+classId };
      var proto = Model.prototype;
      if (proto.discriminatorMap && !proto.hasOwnProperty("discriminatorMap")) {
        // dig into parent class and find the one wich define the discriminatorMap
        while (!proto.hasOwnProperty("discriminatorMap")) {
          proto = proto.constructor.superclass;
        }
        options.rootStore = self.getStore(proto.constructor);
      }

      var Store = Model.prototype.Store || ModelStore;
      stores[classId] = new Store(options);
    }

    return stores[classId];
  },

  ioWrap: function(io, store) {
    return lang.delegate(store, { io: io });
  },

  /**
   * Get store for corresponding model, wrapped with application view IO
   *
   * If 'app' is null, a regular store is returned
   *
   * @param {geonef/jig/data/pane/app/AppView} appView
   * @param {geonef/jig/data/model/Abstract} Model
   * @return {geonef/jig/data/model/ModelStore}
   */
  getAppStore: function(appView, Model) {
    var store = self.getStore(Model);

    return appView ? appView.ioWrap(store) : store;
  },

  // /**
  //  * Flatten value recursively
  //  *
  //  * It processes model objects and array recursively to produce
  //  * a result made of only scalar values and dumb objects and arrays.
  //  *
  //  * @param {mixed} object
  //  * @return {mixed}
  //  */
  // flatten: function(value) {
  //   if (dojo/isArray(value)) {
  //     return value.map(self.flatten);
  //   } else if (dojo/isObject(value) && value) {
  //     // if (value.exportProperties) {
  //     //   value = value.exportProperties();
  //     // }
  //     return dojo/mixin({}, value);
  //     // return geonef/jig/map(value, self.flatten); // infinite loop
  //   } else {
  //     return value;
  //   }
  // }
};

  return self;

});

