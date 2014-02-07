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
  "dojo/promise/all",
  "../../util/async",
  "../../util/value",
], function(module, require, declare, api, lang, topic, when, whenAll, async, value) {

  var ConsoleIO = declare(null, {

    get: function(store, id) {

    },

    apiRequest: function(store, params, options, object) {
      var module = object ? object.apiModule : store.apiModule;
      return api.request(
        lang.mixin({ module: module }, store.apiParams, params), options);
    },


  });

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
    lang.mixin(this, options);
    if (this.rootStore) {
      this.index = this.rootStore.index;
    } else {
      this.index = {};
    }
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
    options = lang.mixin({}, options);
    var obj;
    if (typeof id == "string") {
      obj = this.index[id];
    } else {
      obj = id;
      id = obj.id;
    }
    // working with fieldGroup on given object
    var propGroups =  options.fieldGroup && obj && obj._propGroups;

    if (obj && (!options.fields && !options.fieldGroup)) {
      return async.bindArg(obj);
      // if (!options.fields && !options.fieldGroup) {
      //   return obj ? async.bindArg(obj) : this.getLazyObject({ id: id });
      // } else {
    } else if (propGroups && propGroups[options.fieldGroup]) {
      return obj._propGroups[options.fieldGroup];
    } else {
      var _this = this;
      var promise = this.apiRequest(lang.mixin({ action: 'get', id: id }, options),
                                    options ? options.api : {})
        .then(function(resp) {
          if (resp.error) {
            throw new Error(resp.error);
            // return geonef/jig/util/newErrorDeferred(resp.error);
          }
          if (obj) {
            return async.bindArg(obj, obj.fromServerValue(resp.object));

          } else if (resp.object) {
            return _this.getLazyObject(resp.object);

          } else {
            return null;
          }
        })
        .then(function(obj) {
          if (obj && options.fieldGroup && !propGroups) {
            obj._propGroups[options.fieldGroup] = async.bindArg(obj);
          }
          return obj;
        });

      if (propGroups) {
        propGroups[options.fieldGroup] = promise;
      }

      return promise;
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
    // combine subsequent fetchProps call for same object into the same
    // API request, as long as it hasn't been sent (whenSealed)
    if (!object.id) {
      return async.bindArg(object);
    }
    var req = object._fetchPropsReq;
    if (req) {
      var fields = req.fields;
      Array.prototype.push.apply(fields, props.filter(
        function(prop) { return fields.indexOf(prop) === -1; }));

      return req._promise;

    } else {

      var rawPromise;
      var promise =  (
        rawPromise = this.apiRequest({
          action: 'get', id: object.getId(),
          fields: props
        }, null, object)
      ).then(function(resp) {
        return async.bindArg(object, object.fromServerValue(resp.object));
      });

      object._fetchPropsReq = rawPromise._request;
      object._fetchPropsReq._promise = promise;

      rawPromise.whenSealed.then(function() {
        delete object._fetchPropsReq;
      });

      return promise;
    }
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
    object._beingSaved = true;
    var deferred = object.toServerValue()
      .then(function(value) {
        return _this.apiRequest(lang.mixin({
          action: 'put',
          object: value,
        }, options), {}, object);
      })
      .then(function(resp) {
        if (!object.id) {
          _this.index[resp.object.id] = object;
        }
        return async.bindArg(object, object.fromServerValue(resp.object));
      })
      .then(function() {
        object._beingSaved = false;
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
    if (object.getId()) {
      throw new Error("object is not new, it has ID: "+object.getId()+
                      " ["+object.getSummary()+"]");
    }
    options = options || {};
    options.overwrite = false;
    if (object.beforeCreate) {
      object.beforeCreate();
    }
    var dfr = this.put(object, options)
      .then(function(_arg) {
        if (object.afterCreate) {
          object.afterCreate();
        }
        return _arg;
      });
    object.publish(['create']);

    return dfr;
  },

  /**
   * Duplicate the given object (through server API)
   *
   * @param {geonef/jig/data/model/Abstract} object the model object
   * @param {Object} options API options (see geonef/jig/api)
   * @return {dojo/Deferred} callback whose arg is the copy model object
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
   * Query the store with filter
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
    var implied = {};
    var newFilter = {};;
    var prop, tmpFilter;

    var Abstract = require('./Abstract');
    // fix filter and make up implied value from it
    if (filter) {
      for (prop in filter) if (filter.hasOwnProperty(prop)) {

        tmpFilter = newFilter[prop] = filter[prop];
        if (tmpFilter instanceof Abstract) {
          tmpFilter = newFilter[prop] = { op: 'ref', value: tmpFilter.id };
        } else if (typeof tmpFilter == 'string' || !isNaN(tmpFilter)) {
          tmpFilter = newFilter[prop] = { op: 'equals', value: tmpFilter };
        }
        if (tmpFilter.op === "equals") {
          implied[prop] = tmpFilter.value;
        } else if (tmpFilter.op === "ref") {
          implied[prop] = { id: tmpFilter.value };
        }
      }
    }

    return this.apiRequest(lang.mixin({
      action: 'query',
      filters: newFilter,
    }, options))
      .then(lang.hitch(this, function(resp) {
        if (resp.ifMatch === false) {
          throw "geonef-data-query-notMatched";
        }
        if (!resp.results) {
          console.error("model query ("+this.apiModule+"): no result array", resp);
          return null;
        }
        return whenAll(resp.results.map(
          function(data) {
            return this.getLazyObject(lang.mixin({}, implied, data));
          }, this))
          .then(function(results) {
            ["resultCount", "pageLength", "pageCount", "currentPage"].forEach(
              function(prop) { results[prop] = resp[prop]; });

            return results;
          });
      }));
  },

  /**
   * Remove from DB (unpersist) an object
   *
   * @param {geonef/jig/data/model/Abstract} object the model object
   * @return {dojo/Deferred} callback with no arg
   */
  remove: function(obj) {
    var deferred;
    if (obj.id) {
      deferred = this.apiRequest({
        action: 'delete',
        id: obj.getId(),
      }, null, obj)
        .then(lang.hitch(obj, obj.afterDelete)
              /*function(resp) {
                obj.afterDelete();
                }*/);
    } else {
      deferred = async.bindArg();
    }
    obj.publish(['delete']);
    return deferred;
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
        discriminatorValue = this.Model.prototype.discriminatorKey;
      }
      if (!discriminatorValue) {
        // if (this.Mo) {
        // var map = this.Model.prototype.discriminatorMap;

        // } else {
        throw new Error("createObject(): discriminator is required");
        // }
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
   * Instanciate the model (for private use) - app code should use createObject()
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
        console.error("happening on store", this, ", model ", this.Model.prototype,
                      "makeObject(): invalid discriminator '"+discrProp+"': "+discrValue);
        throw new Error("makeObject(): invalid discriminator '"+
                        discrProp+"': "+discrValue);
      }
      Model = value.getModule(_class);
    }
    var _this = this;

    return when(Model).then(function(Model) {
      return new Model({ store: _this });
    });
  },

  /**
   * Create object (or get from ref), then hydrate from given flat data
   *
   * This is the right function to use to instanciate a model object
   * which has an identifier.
   *
   * @param {Object} data Hash of property values (must have a valid 'id' key)
   * @return {dojo/Deferred}
   */
  getLazyObject: function(data) {
    var index = this.index;
    var obj = index[data.id];
    if (!obj) {
      obj = this.makeObject(data).then(function(_obj) {
        index[data.id] = _obj;
        return _obj;
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
   * Specialisation of geonef/jig/api.request, for this class
   */
  apiRequest: function(command, options, object) {
    var module = object ? object.apiModule : this.apiModule;
    // if (this.io) {
    //   console.info("io :)", this.io, command, this);
    // } else {
    //   console.warn("no io!", this.io, command, this);
    // }
    return this.io.command(
      lang.mixin({ module: module }, this.apiParams, command), options);
    // return api.request(
    //   lang.mixin({ module: module }, this.apiParams, params), options);
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
    // make up base64 string
    for (i = 0; i < 16 - str.length; i++) {
      str = str + 'A';
    }
    str = str.replace(/-/g, '+').replace(/_/g, "/");
    // decode to binary
    str = atob(str);
    // recode in hexa
    var c = '';
    for (i = 0; i < 12; i++) {
      var code = i < str.length ? str.charCodeAt(i).toString(16) : '0';
      c += ((code.length === 1) ? '0' : '') + code;
    }
    return c;
  },

  // // partially copied to data/model.js
  // /**
  //  * Is the given model obj is part of this store and matches the given filter?
  //  */
  // matchFilter: function(object, filter) {
  //   var ops = {
  //     equals: function(type, objectValue, filterValue) {
  //       var isSame = type.isSame || value.isSame;
  //       return isSame(objectValue, filterValue, type);
  //     },
  //     notEquals: function(type, objectValue, filterValue) {
  //       var isSame = type.isSame || value.isSame;
  //       return !isSame(objectValue, filterValue, type);
  //     },
  //     ref: function(type, objectValue, filterValue) {
  //       return objectValue && objectValue.id === filterValue;
  //     },
  //     gt: function(type, objectValue, filterValue) {
  //       return objectValue > filterValue;
  //     },
  //     gte: function(type, objectValue, filterValue) {
  //       return objectValue >= filterValue;
  //     },
  //     lt: function(type, objectValue, filterValue) {
  //       return objectValue < filterValue;
  //     },
  //     lte: function(type, objectValue, filterValue) {
  //       return objectValue <= filterValue;
  //     },
  //   };

  //   return object instanceof this.Model &&
  //     Object.keys(filter).every(function(name) {
  //       var prop = object.properties[name];
  //       if (prop === undefined) {
  //         // Server-only filter prop or not hydrated value:
  //         // we don't know whether it matches, consider it doesn't
  //         console.log("prop undef", name, filter, object);
  //         return false;
  //       }
  //       var rule = filter[name];
  //       if (!rule.op) {
  //         rule = { op: "equal", value: rule };
  //       }
  //       var type = prop.type;
  //       console.log("test", name, rule.op, object[name], rule.value,
  //                   ops[rule.op](type, object[name], rule.value));
  //       return ops[rule.op](type, object[name], rule.value);
  //     });
  // },

  declaredClass: module.id

});

});
