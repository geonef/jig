define("geonef/jig/data/model/ModelStore", ["geonef/jig/api", "dojo"], function(api, d) {

d.declare("geonef.jig.data.model.ModelStore", null,
{

  /**
   * @type {geonef.jig.data.model.Abstract}
   */
  Model: null,

  /**
   * @type {string} API module (ex: "geonefZig/data/file")
   */
  module: null,

  /**
   * @type {Object} volatile cache
   */
  index: null,

  /**
   * @type {string} Channel for notif publishing
   */
  channel: null,


  constructor: function(options) {
    this.index = {};
    d.mixin(this, options);
    if (!this.module) {
      this.module = this.Model.prototype.module;
    }
    if (!this.channel) {
      this.channel = this.Model.prototype.channel;
    }
  },

  get: function(id) {
    if (this.index[id]) {
      var promise = new geoenf.jig.Deferred();
      promise.resolve(this.index[id]);
      return promise;
    } else {
      var self = this;
      return this.apiRequest({ action: 'get', id: id })
          .then(function(resp) {
                  self.index[id] = self.makeObject(resp.object);
                  return self.index[id];
                });
    }
  },

  getIdentity: function(object) {
    return object.getId();
  },

  /**
   * Stores an object. Trigger a call to the server API.
   */
  put: function(object, options) {
    var self = this;
    var deferred = this.apiRequest(
        { action: 'put',
          object: object.toServerValue(),
          options: options || {} })
      .then(function(resp) {
              // console.log('in PUT then', this, arguments);
              var id = object.getId();
              object.fromServerValue(resp.object);
              if (!id) {
                self.index[object.getId()] = object;
              }
              return object;
            });
    object.publish(['put']);
    return deferred;
  },

  /**
   * Add (persist) a new (unpersisted) object
   */
  add: function(object, options) {
    // console.log('add', this, arguments);
    if (object.getId()) {
      throw new Error("object is not new, it has ID: "+object.getId()+
                      " ["+object.getSummary()+"]");
    }
    options = options || {};
    options.overwrite = false;
    var dfr = this.put(object, options);
    object.publish(['create']);

    return dfr;
  },

  query: function(query, options) {
    // console.log('query', this, arguments);
    return this.apiRequest(
        { action: 'query',
          filters: query,
        }).then(d.hitch(this, function(resp) {
                  return resp.results.map(
                      function(r) {
                        var obj = this.makeObject(r);
                        this.index[r.id] = obj;
                        return obj;
                      }, this);
                }));
  },

  remove: function(obj) {
    console.log('remove', this, arguments);
    var deferred = this.apiRequest(
        { action: 'delete',
          id: obj.getId(),
        }).then(d.hitch(this, function(resp) {
                  console.log('in query then', this, arguments);
                }));
    obj.publish(['delete']);
    return deferred;
  },

  /**
   * Create object out of data
   *
   * @return {geonef.jig.data.model.Abstract} the new object
   */
  makeObject: function(data) {
    var object = new (this.Model)({ store: this });
    if (data) {
      object.fromServerValue(data);
    }

    return object;
  },

  /**
   * Specialisation of geoenf.jig.api.request, for this class
   */
  apiRequest: function(params) {
    return api.request(d.mixin(
        { module: this.module, scope: this }, params));
  }

});

return geonef.jig.data.model.ModelStore;
});

