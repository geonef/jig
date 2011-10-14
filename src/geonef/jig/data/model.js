define("geonef/jig/data/model", ["geonef.jig.data.model.ModelStore"], function(ModelStore) {


dojo.mixin(geonef.jig.data.model,
{
  _stores: {},

  /**
   * @param {string} module the name of the name (ie. "geonefPloomap/map")
   */
  getStore: function(module) {
    var stores = geonef.jig.data.model._stores;
    if (!stores[module]) {
      stores[module] = new ModelStore({ module: module });
    }

    return stores[module];
  },

});


});
