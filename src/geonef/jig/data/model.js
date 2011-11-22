define("geonef/jig/data/model", ["geonef/jig/data/model/ModelStore"], function(ModelStore) {

/**
 * Global model object
 *
 * Use it to instanciate model stores
 */
dojo.mixin(geonef.jig.data.model,
{
  _stores: {},

  /**
   * Get store for corresponding model
   *
   * @param {geonef.jig.data.model.Abstract} Model
   * @return {geonef.jig.data.model.ModelStore}
   */
  getStore: function(Model) {
    var stores = geonef.jig.data.model._stores;
    var module = Model.prototype.module;
    if (!stores[module]) {
      var _Class = Model.prototype.Store || geonef.jig.data.model.ModelStore;
      stores[module] = new _Class({ Model: Model });
    }

    return stores[module];
  },

});

return geonef.jig.data.model;
});
