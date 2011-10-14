define("geonef/jig/data/model/ModelStore", ["dojo/store/Memory", "geonef/jig/api", "dojo"], function(Memory, api, dojo) {

dojo.declare("geonef.jig.data.model.ModelStore", Memory,
{
  /**
   * @type {string} API module (ex: "geonefZig/data/file")
   */
  module: null,

  constructor: function() {

  },

  get: function(id) {
    return this.index[id] === undefined ?
      this.apiRequest(
        { action: 'get', id: id,
          callback: function(resp) {
            this.index[id] = this.makeObj(resp.data);
          } }) :
      this.index[id];
  },

  /**
   * Create object out of data
   */
  makeObj: function(data) {
    var obj = {};
    dojo.mixin(obj, data);

    return obj;
  },

  /**
   * Specialisation of geoenf.jig.api.request, for this class
   */
  apiRequest: function(params) {
    return api.request(dojo.mixin(
        { module: this.module, scope: this }, params));
  }

});

});

