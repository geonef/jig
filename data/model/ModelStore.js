/**
 * Model store - equivalent for Doctrine repositories
 *
 * It is a singleton, meant to be retrieved from geonef/jig/data/model
 * Needs to be instanciated with the 'Model' property.
 *
 * @example
 *   var customStore = geonef/jig/data/model/getStore(CustomModel);
 *
 *   // customStore instanceof ModelStore (true)
 *   // if CustomModel.prototype.Store is defined, it is used instead of ModelStore
 *
 *   customStore
 *     .get("4e6ffdffa93ac81c5f000000")
 *     .then(function(customObject) {
 *             customObject.set('prop', 'value');
 *             customStore.put(customObject)
 *                        .then(function() {
 *                                  console.log("saved", customObject);
 *                              });
 *           });
 *
 *   customStore.makeObject({ name: "hehe" })
 *      .then(function(newCustom) {
 *         return customStore.save(newCustom);
 *      })
 *      .then(function(newCustom) {
 *         console.log("saved", obj);
 *      });
 *
 *   // For an example of a custom store, see geonef/jig/data/model/UserStore.
 *
 * @see geonef/jig/data/model/Abstract
 * @see geonef/jig/data/model/UserStore
 */
define([
  "module", "require",
  "dojo/_base/declare",
  "../../api",
  "dojo/_base/lang",
  "dojo/topic",
  "dojo/when",
  "../../util/async",
  "../../util/value",
], function(module, require, declare, api, lang, topic, when, async, value) {

return declare(null, { //--noindent--

  /**
   * Model of the store
   *
   * @type {geonef/jig/data/model/Abstract}
   */
  Model: null,

  /**
   * Server API module for persistance
   *
   * Example: "geonefZig/data/file".
   * If not specified, will be taken from Model's prototype
   *
   * @type {string}
   */
  apiModule: null,

  /**
   * Local volatile cache
   *
   * @type {Object}
   */
  index: null,

  /**
   * Channel for notification publishing
   *
   * @type {string}
   */
  channel: null,

  /**
   * Additional parameters for server API requests
   *
   * @type {Object}
   */
  apiParams: {},


  /**
   * constructor
   */
  constructor: function(options) {
    this.index = {};
    lang.mixin(this, options);
    this.apiParams = lang.mixin({}, this.apiParams);
    this.postMixInProperties();
    if (!this.apiModule) {
      this.apiModule = this.Model.prototype.apiModule;
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
    if (this._subcr) {
      this._subcr.forEach(function(c) { c.remove(); });
      delete this._subcr;
    }
  },

  /**
   * Fetch object by ID - async
   *
   * If found in the volatile cache, no API request is made.
   *
   * Available options:
   *    - fields:       array of properties to fetch
   *    - fieldGroup:   name of property group to fetch (exclusive of 'fields')
   *    - api:          object of API transport options (see geonef/jig/api)
   *
   * @param {string} id Identifier
   * @param {!Object} options Hash of options
   * @return {dojo/Deferred}
   */
  get: function(id, options) {
    var obj = this.index[id];
    if (obj && (!options || (!options.fields && !options.fieldGroup))) {
      return async.newResolved(obj);
    } else {
      var _this = this;
      return this.apiRequest(lang.mixin({ action: 'get', id: id }, options),
                             options ? options.api : {})
        .then(function(resp) {
          if (resp.error) {
            throw new Error(resp.error);
            // return geonef/jig/util/newErrorDeferred(resp.error);
          }
          if (obj) {
            return async.bindArg(obj, obj.fromServerValue(resp.object));
          } else if (resp.object) {
            // index the object first before setting values
            // obj = _this.index[id] = _this.makeObject(resp.object);
            // obj.fromServerValue(resp.object);
            return _this.getLazyObject(resp.object);
          } else {
            return null;
          }
        });
    }
  },

  /**
   * Get document by refID - async
   *
   * @param {string} ref
   * @param {!Object} options same options as to ModelStore.get()
   * @return {dojo/Deferred}
   */
  getByRef: function(ref, options) {
    return this.get(this.refToId(ref), options);
  },

  /**
   * Fetch property value for given object
   *
   * This is used for "lazy" loading some properties.
   * The property value is automatically updated within the object.
   *
   * @param {geonef/jig/data/model/Abstract} object the model object
   * @param {Array.<string>} props Array of property names to fetch
   * @return {dojo/Deferred} callback whose arg is the property value
   */
  fetchProps: function(object, props) {
    return this.apiRequest({
      action: 'get', id: object.getId(),
      fields: props
    }, null, object)
      .then(function(resp) {
        return async.bindArg(object, object.fromServerValue(resp.object));
      });
  },

  /**
   * Get object identifier
   *
   * @return {string}
   */
  getIdentity: function(object) {
    return object.getId();
  },

  /**
   * Stores an object. Will trigger a call to the server API.
   *
   * A ("put") message is sent on the channel right after the
   * request has been made (but before it is executed).
   *
   * @param {geonef/jig/data/model/Abstract} object the model object
   * @param {Object} options API options (see geonef/jig/api)
   * @return {dojo/Deferred} callback whose arg is the model object
   */
  put: function(object, options) {
    var _this = this;
    var deferred = object.toServerValue()
      .then(function(value) {
        return _this.apiRequest(lang.mixin({
          action: 'put',
          object: value,
        }, options), {}, object);
      })
      .then(function(resp) {
        // console.log('in PUT then', arguments, object);
        if (!object.id) {
          _this.index[resp.object.id] = object;
        }
        return async.bindArg(object, object.fromServerValue(resp.object));
      })
      .then(function() {
        object.publish(['afterPut']);
        return object;
      });

    object.publish(['put']);
    return deferred;
  },

  /**
   * Add (persist) a new (unpersisted) object
   *
   * A ("create") message is sent on the channel right after the
   * request has been made (but before it is executed).
   * That message is preceded with ("put") caused by the inner 'put'.
   *
   * @param {geonef/jig/data/model/Abstract} object the model object
   * @param {Object} options API options (see geonef/jig/api)
   * @return {dojo/Deferred} callback whose arg is the model object
   */
  add: function(object, options) {
    // console.log('add', this, arguments);
    if (object.getId()) {
      throw new Error("object is not new, it has ID: "+object.getId()+
                      " ["+object.getSummary()+"]");
    }
    options = options || {};
    options.overwrite = false;
    if (object.beforeCreate) {
      object.beforeCreate();
    }
    var dfr = this.put(object, options);
    object.publish(['create']);

    return dfr;
  },

  /**
   * Duplicate the given object (through server API)
   *
   * @param {geonef/jig/data/model/Abstract} object the model object
   * @param {Object} options API options (see geonef/jig/api)
   * @return {dojo/Deferred} callback whose arg is the model object
   */
  duplicate: function(object, options) {
    var _this = this;
    var obj, resp;
    return this.apiRequest(lang.mixin({
      action: 'duplicate', id: object.id,
    }, options), null, object)
      .then(function(_resp) {
        resp = _resp;
        return _this.makeObject(_resp.object);
      })
      .then(function(_obj) {
        obj = _obj;
        _this.index[resp.object.id] = obj;
        return async.bindArg(obj, obj.fromServerValue(resp.object));
      })
      .then(function() { return obj.afterDuplicate(); })
      .then(function() {
        obj.publish(['put']);
        obj.publish(['afterPut']);
        return obj;
      });
  },

  /**
   * Add (persist) a new (unpersisted) object
   *
   * 'filter' is something like:
   *   {
   *     stringProp: { op: 'equal', value: 'test' },
   *     integerProp: { op: 'sup', value: 42 },
   *     refProp: { op: 'ref', value: 'test' },
   *   }
   *
   * Options are added to the API request itself, custom options
   * can exist depending on the API module for the model object class.
   *
   * Typical options:
   *    - sort (object with keys 'name' and 'desc'
   *    - pageLength
   *    - page
   *
   * @param {Object.<string,Object>} filter Query filters
   * @param {Array.<string>} options API options (see geonef/jig/api)
   * @return {dojo/Deferred} callback whose arg is the model object
   */
  query: function(filter, options) {
    // console.log('filter', this, arguments);
    var implied = {};
    var prop, tmpFilter;

    var Abstract = require('./Abstract');
    // fix filter and make up implied value from it
    if (filter) {
      for (prop in filter) if (filter.hasOwnProperty(prop)) {
        tmpFilter = filter[prop];
        if (tmpFilter instanceof Abstract) {
          tmpFilter = filter[prop] = { op: 'ref', value: tmpFilter };
        } else if (typeof tmpFilter == 'string' || !isNaN(tmpFilter)) {
          tmpFilter = filter[prop] = { op: 'equals', value: tmpFilter };
        }
        if (['equals', 'ref'].indexOf(tmpFilter.op) !== -1) {
          implied[prop] = tmpFilter.value;
        }
        if (tmpFilter.value instanceof Abstract) {
          tmpFilter.value = tmpFilter.value.getId();
        }
      }
    }

    return this.apiRequest(lang.mixin({
      action: 'query',
      filters: filter, /* options: options || {}*/
    }, options))
      .then(lang.hitch(this, function(resp) {
        if (!resp.results) {
          console.error("model query ("+this.apiModule+"): no result array", resp);
          return null;
        }
        return async.whenAll(resp.results.map(
          function(data) {
            return this.getLazyObject(lang.mixin({}, implied, data));
          }, this));
      }));
  },

  /**
   * Remove from DB (unpersist) an object
   *
   * @param {geonef/jig/data/model/Abstract} object the model object
   * @return {dojo/Deferred} callback with no arg
   */
  remove: function(obj) {
    var deferred = this.apiRequest(
      { action: 'delete',
        id: obj.getId(),
      }, null, obj).then(function(resp) {
        obj.afterDelete();
      });
    obj.publish(['delete']);
    return deferred;
  },

  /**
   * Create new object (for private use)
   *
   * WARNING: the object is not added to the local cache,
   *          and dataForDiscriminator is used only to distinguish
   *          what class to use if a discriminatorProperty is defined.
   *
   * @param {Object} dataForDiscriminator data object whose discriminator
   *                     field (if any) is used to determine the class to instanciate
   * @return {dojo/Deferred} promise with created object
   */
  makeObject: function(dataForDiscriminator) {
    var Model = this.Model;
    var discrProp = Model.prototype.discriminatorProperty;
    if (discrProp) {
      var discrValue = dataForDiscriminator[discrProp];
      var _class = Model.prototype.discriminatorMap[discrValue];
      if (!discrValue || !_class) {
        console.error("happening on store", this, ", model ", this.Model.prototype);
        throw new Error("makeObject(): invalid discriminator '"+
                        discrProp+"': "+discrValue);
      }
      Model = value.getModule(_class);
      // throw new Error("ModelStore::makeObject[discr="+discrValue+"]: "+
      //                 "needs a fix for async loading of discr class module");
    }
    var _this = this;

    return when(Model).then(function(Model) {
      return new Model({ store: _this });
    });
  },

  /**
   * Create a fresh new object (to be used from app code)
   *
   * @param {string} discriminatorValue dicriminator value to use (if needed for that model)
   * @return {dojo/Deferred} promise with created object
   */
  createObject: function(discriminatorValue) {
    var data = {};
    var discrProp = this.Model.prototype.discriminatorProperty;
    if (discrProp) {
      if (!discriminatorValue) {
        throw new Error("createObject(): discriminator is required");
      }
      data[discrProp] = discriminatorValue;
    }

    return this.makeObject(data).then(function(object) {
      lang.mixin(object, data);
      object.initNew();
      return object;
    });
  },

  /**
   * Create object (or get ref), hydrate from given data
   *
   * This is the right function to use to instanciate a model object
   * which has an identifier.
   *
   * @param {Object} data Hash of property values (must have a valid 'id' key)
   * @return {dojo/Deferred}
   */
  getLazyObject: function(data) {
    var obj = this.index[data.id];
    var _this = this;
    if (!obj) {
      obj = this.makeObject(data).then(function(obj) {
        _this.index[data.id] = obj;
        return obj;
      });
    }
    return when(obj).then(function(obj) {
      return async.bindArg(obj, obj.fromServerValue(data));
    });
  },

  /**
   * Clear the local cache
   *
   * This is used by unit test modules to force data re-fetch.
   * After this call, all previously cached model objects must not be used
   * (or redundant objects could appear, breaking the app logic).
   */
  clearCache: function() {
    this.index = {};
  },


  /**
   * Specialisation of geoenf.jig.api.request, for this class
   */
  apiRequest: function(params, options, object) {
    var module = object ? object.apiModule : this.apiModule;
    return api.request(
      lang.mixin({ module: module, scope: this },
                 this.apiParams, params),
      options);
  },

  /**
   * Helper for dojo/topic.subscribe(), handling unsubscribe at destroy()
   */
  subscribe: function(channel, callback) {
    if (!this._subscr) {
      this._subscr = [];
    }
    var _h = topic.subscribe(channel, lang.hitch(this, callback));
    this._subscr.push(_h);
    return _h;
  },

  /**
   * Unsubscribe event registered with self subscribe()
   */
  unsubscribe: function(_h) {
    var idx = this._subscr.indexOf(_h);
    _h.remove();
    this._subscr.splice(idx, 1);
  },

  /**
   * Convert a document ID to base64-modified reference | static
   *
   * Used to make the URL of an iti
   */
  idToRef: function(id) {
    return 'x' +
      btoa(String.fromCharCode.apply(
        null,
        id//.replace(/\r|\n/g, "")
          .replace(/([\da-fA-F]{2}) ?/g, "0x$1 ")
          .replace(/ +$/, "")
          .split(" "))
          ).replace(new RegExp("\/", 'g'), "_")
      .replace(/\+/g, "-")
      .replace(/A+$/, "");
  },

  /**
   * Convert a reference ID to document ID | static
   *
   * Used to decode an iti URL
   */
  refToId: function(ref) {
    if (ref[0] !== 'x') { return ref; }

    var i;
    var str = ref.substr(1);
    for (i = 0; i < 16 - str.length; i++) {
      str = str + 'A';
    }
    str = str.replace(/-/g, '+').replace(/_/g, "/");
    str = atob(str);
    var c = '';
    for (i = 0; i < 12; i++) {
      var code = i < str.length ? str.charCodeAt(i).toString(16) : '0';
      c += ((code.length === 1) ? '0' : '') + code;
    }
    return c;
  },

  declaredClass: module.id

});

});

