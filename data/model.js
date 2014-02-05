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
  "dojo/_base/lang",
  "../util/value",
], function(ModelStore, lang, value) {


var self = { //--noindent--

  _stores: {},

  /**
   * Get store for corresponding model
   *
   * @param {geonef/jig/data/model/Abstract} Model
   * @param {geonef/jig/io/IOInterface} io
   * @return {geonef/jig/data/model/ModelStore}
   */
  getStore: function(Model, io) {
    var stores = self._stores;
    var classId = Model.prototype.declaredClass;
    var store;
    if (!(store = stores[classId])) {
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
      store = stores[classId] = new Store(options);
    }

    return io ? self.ioWrap(io, store) : store;
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


  /**
   * Is the given model obj is part of this store and matches the given filter?
   */
  queryToFilterFunc: function(filter) {
    var ops = {
      equals: function(type, objectValue, filterValue) {
        var isSame = type.isSame || value.isSame;
        return isSame(objectValue, filterValue, type);
      },
      notEqual: function(type, objectValue, filterValue) {
        var isSame = type.isSame || value.isSame;
        return !isSame(objectValue, filterValue, type);
      },
      ref: function(type, objectValue, filterValue) {
        return objectValue && objectValue.id === filterValue;
      },
      gt: function(type, objectValue, filterValue) {
        return objectValue > filterValue;
      },
      gte: function(type, objectValue, filterValue) {
        return objectValue >= filterValue;
      },
      lt: function(type, objectValue, filterValue) {
        return objectValue < filterValue;
      },
      lte: function(type, objectValue, filterValue) {
        return objectValue <= filterValue;
      },
    };

    return function(object) {
      return Object.keys(filter).every(function(name) {
        var prop = object.properties[name];
        if (prop === undefined) {
          // Server-only filter prop or not hydrated value:
          // we don't know whether it matches, consider it doesn't
          console.log("prop undef", name, filter, object);
          return false;
        }
        var rule = filter[name];
        if (!rule.op) {
          rule = { op: "equals", value: rule };
        }
        var type = prop.type;
      // console.log("test", name, rule.op, object[name], rule.value,
      //             ops[rule.op](type, object[name], rule.value));
        var handler = ops[rule.op];
        if (!handler) {
          console.error("data/model::queryToFilterFunc(): invalid operator:", rule.op, "rule=", rule);
        }
        return handler(type, object[name], rule.value);
      });
    };
  },

};

  return self;

});
