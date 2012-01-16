define("geonef/jig/data/model/ModelStore", ["geonef/jig/api", "dojo", "geonef/jig/util"], function(api, dojo, jigUtil) {


/**
 * Model store - equivalent for Doctrine repositories
 *
 * It is a singleton, meant to be retrieved from geonef.jig.data.model
 * Needs to be instanciated with the 'Model' property.
 *
 * Example:
 *   var pgLinkViewStore =
 *         geonef.jig.data.model.getStore(geonef.jig.data.model.PgLinkView);
 *
 *   pgLinkViewStore
 *     .get("4e6ffdffa93ac81c5f000000")
 *     .then(function(pgLinkView) {
 *             pgLinkView.set('prop', 'value');
 *             pgLinkViewStore.put(pgLinkView)
 *                            .then(function() {
 *                                      console.log("saved', pgLinkView);
 *                                  });
 *           });
 *
 *   var pgLinkView = pgLinkViewStore.makeObject({ name: "hehe" });
 *   pgLinkViewStore
 *       .add(pgLinkView)
 *       .then(function(obj) { console.log("saved", obj); });
 *
 * @see geonef.jig.data.model
 */
dojo.declare("geonef.jig.data.model.ModelStore", null,
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

  apiParams: {},


  constructor: function(options) {
    this.index = {};
    dojo.mixin(this, options);
    this.apiParams = dojo.mixin({}, this.apiParams);
    this.postMixInProperties();
    this.normalizeProperties();
    if (!this.module) {
      this.module = this.Model.prototype.module;
    }
    if (!this.channel) {
      this.channel = this.Model.prototype.channel;
    }
    this.init();
    this.setupEvents();
  },

  /** hook */
  postMixInProperties: function() {
  },

  /** hook */
  init: function() {
  },

  /** hook */
  setupEvents: function() {
  },

  destroy: function() {
  },

  normalizeProperties: function() {
    var props = this.Model.prototype.properties;
    for (var p in props) if (props.hasOwnProperty(p)) {
      if (!dojo.isObject(props[p])) {
        props[p] = { type: props[p] };
      }
      if (props[p].readOnly !== true && props[p].readOnly !== false) {
        props[p].readOnly = false;
      }
    }
  },

  /**
   * Fetch object by ID
   *
   * If found in the volatile cache, no API request is made.
   *
   * @return {geonef.jig.data.model.Abstract}
   */
  get: function(id, options) {
    var obj = this.index[id];
    if (obj && (!options || (!options.fields && !options.fieldGroup))) {
      return geonef.jig.util.newResolvedDeferred(obj);
    } else {
      var self = this;
      return this.apiRequest(dojo.mixin({ action: 'get', id: id }, options),
                             options ? options.api : {})
          .then(function(resp) {
                  if (obj) {
                    obj.fromServerValue(resp.object);
                  } else if (resp.object) {
                    // index the object first before setting values
                    obj = self.index[id] = self.makeObject();
                    obj.fromServerValue(resp.object);
                  } else {
                    return null;
                  }
                  return obj;
                });
    }
  },

  /**
   * Fetch property value for given object
   *
   * This is used for "lazy" loading some properties.
   * The property value is automatically updated within the object.
   *
   * @return {dojo.Deferred} callback arg is the property value
   */
  fetchProps: function(object, props) {
    var self = this;
    return this.apiRequest({ action: 'get', id: object.getId(),
                             fields: props })
      .then(function(resp) {
              // var obj = {};
              // props.forEach(function(p) { obj[p] = resp.object[p] || null; });
              // object.fromServerValue(obj);
              object.fromServerValue(resp.object);
              return object;
            });
  },

  getIdentity: function(object) {
    return object.getId();
  },

  /**
   * Stores an object. Trigger a call to the server API.
   */
  put: function(object, options) {
    var self = this;
    var deferred = this.apiRequest(dojo.mixin(
        { action: 'put',
          object: object.toServerValue(),
        }, options))
      .then(function(resp) {
              // console.log('in PUT then', arguments, object);
              var id = object.getId();
              object.fromServerValue(resp.object);
              if (!id) {
                self.index[object.getId()] = object;
              }
              object.publish(['afterPut']);
              return object;
            });
    object.publish(['put']);
    return deferred;
  },

  /**
   * Add (persist) a new (unpersisted) object
   */
  add: function(object, options) {
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
    return this.apiRequest(dojo.mixin(
        { action: 'query', filters: query, /* options: options || {}*/ }, options))
      .then(dojo.hitch(this,
        function(resp) {
          if (!resp.results) {
            console.error("model query ("+this.module+"): no result array", resp);
            return null;
          }
          console.log('query: results');
          return resp.results.map(this.getLazyObject, this);
          // function(r) {
          //   return this.getLazyObject(r);
          //   // var obj = this.index[r.id] = this.makeObject();
          //   // obj.fromServerValue(r);
          //   // return obj;
          // }, this);
        }));
  },

  remove: function(obj) {
    var deferred = this.apiRequest(
        { action: 'delete',
          id: obj.getId(),
        }).then(dojo.hitch(this, function(resp) {
                }));
    obj.publish(['delete']);
    return deferred;
  },

  /**
   * Create new object out of data
   *
   * WARNING: it is usually wrong to call this method with a 'data' object,
   *          since at the time fromServerValue() is called, the object
   *          is not yet references in the index.
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
   * Create a new object (to be used from app code)
   */
  createObject: function() {
    var object = this.makeObject();
    object.initNew();
    return object;
  },

  /**
   * Create object (or get ref), inject given data
   */
  getLazyObject: function(data) {
    var obj = this.index[data.id];
    if (obj) {
      obj.fromServerValue(data);
    } else {

      obj = this.index[data.id] = this.makeObject();
      obj.fromServerValue(data);
    }
    return obj;
  },

  clearCache: function() {
    this.index = {};
  },


  /**
   * Specialisation of geoenf.jig.api.request, for this class
   */
  apiRequest: function(params, options) {
    return geonef.jig.api.request(dojo.mixin(
        { module: this.module, scope: this }, this.apiParams, params), options);
  },

  getWktFormat: function() {
    if (!this.wktFormat) {
      this.wktFormat = new OpenLayers.Format.WKT();
    }

    return this.wktFormat;
  },


});

return geonef.jig.data.model.ModelStore;
});

