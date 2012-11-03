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
 * If need be, a model can have a custom store: it's has to inherit from
 * 'geonef/jig/data/model/ModelStore' and be specified in the model's 'Store'
 * property (as a class). A good example of this is the 'User' model.
 *
 * The store object is that start point to make any operation on the model
 * (query, find, save, delete). See 'geonef/jig/data/model/ModelStore' for
 * documentation on this.
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
      var _Class = Model.prototype.Store || ModelStore;
      stores[classId] = new _Class({ Model: Model });
    }

    return stores[classId];
  },

  /**
   * Transform given properties definition into canonical form (used for Model's property declaration)
   *
   * @param {Object.<string,Object>} props
   * @return {Object}
   */
  normalizeProperties: function(props) {
    for (var p in props) if (props.hasOwnProperty(p)) {
      if (typeof props[p] != 'object') {
        props[p] = { type: props[p] };
      }
      if (props[p].readOnly !== true && props[p].readOnly !== false) {
        props[p].readOnly = false;
      }
    }
    return props;
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

