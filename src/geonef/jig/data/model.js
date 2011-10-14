define("geonef/jig/data/model", ["geonef.jig.data.model.ModelStore"], function(ModelStore) {


dojo.mixin(geonef.jig.data.model,
{
  _stores: {},

  /**
   * @param {geonef.jig.data.model.Abstract} Model
   */
  getStore: function(Model) {
    var stores = geonef.jig.data.model._stores;
    var module = Model.prototype.module;
    if (!stores[module]) {
      stores[module] = new ModelStore({ Model: Model });
    }

    return stores[module];
  },

});

return geonef.jig.data.model;
});
