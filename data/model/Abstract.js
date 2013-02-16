/**
 * Base class for all models
 *
 * This is the right class to inherit from when building now models.
 *
 * Everything is defined here:
 *
 *   - event channel & publishing
 *   - discriminator property
 *   - the 'id' property which is common to all models
 *   - the supported property types
 *   - data fetching & hydration
 *
 * For a good example of implementing a model, see geonef/jig/data/model/User.
 *
 * @see geonef/jig/data/model/ModelStore
 */
define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/Deferred",
  "dojo/promise/all",
  "dojo/topic",
  "dojo/when",
  "dojo/promise/all",

  "../model",
  "../../util/value",
  "../../util/string",
  "../../util/array",
  "../../util/object",
  "../../util/async",
], function(module, declare, lang, Deferred, allPromises, topic, when, whenAll,
            model, value, string, array, object, async) {


  var goThrough = function(value) { return value; };
  var scalar = {
    fromServer: goThrough,
    toServer: goThrough,
  };

return declare(null, { //--noindent--
  /**
   * Store class to use for this model.
   *
   * If null, default ModelStore is used.
   *
   * @type {Function}
   */
  Store: null,

  /**
   * Channel on which to publish notifications
   *
   * @type {string}
   */
  channel: 'model/default',

  /**
   * Database identifier
   *
   * @type {string}
   */
  id: undefined,

  /**
   * Name of (string) property to use for the discriminator.
   *
   * See the 'discriminatorMap' property for explanations of this feature.
   *
   * @type {string}
   */
  discriminatorProperty: undefined,

  /**
   * Map between discriminator values and model class names
   *
   * When a discriminator is defined (through 'discriminatorProperty'),
   * it is used to determine what model class to instanciate for this model's
   * objects.
   *
   * For example, if 'discriminatorProperty' is set to 'type' and
   * 'discriminatorMap' is set to:
   *   { test: 'data/model/MyTest', other: 'data/model/MyOther' }
   * Then, the first class is used for objects whose 'type' property is set
   * to "test", the second if the value is "other".
   *
   * This is inspired after PHP Doctrine's discriminatorMap feature.
   * See: http://docs.doctrine-project.org/projects/doctrine-mongodb-odm/en/latest/reference/inheritance-mapping.html
   *
   * @type {Object.<string,string>}
   */
  discriminatorMap: null,

  /**
   * List of properties
   *
   * It's in the form of an object whose keys are property names and values
   * are objects defining property attributes.
   *
   * These properties should also be defined as normal properties of
   * the model prototype, with the 'undefined' value for most cases.
   *
   * Here are the supported property attributes:
   *    - type (string):        name of type, must exist in the this.types object
   *    - readOnly (boolean):   whether the property is readOnly
   *    - noEdit (boolean):     whether the property can only be set at creation
   *    - compare (function):   function that take 2 values and compare them
   *                            (used to compute changed properties in 'toServerValue')
   *
   * In order to be compliant, the object must go through
   * geonef/jig/data/model.normalizeProperties.
   *
   * To inherit from a parent Model's properties, use the following syntax:
   *    properties: geonef/jig/data/model.normalizeProperties(
   *      dojo/delegate(geonef/jig/data/model/Abstract.prototype.properties, {
   *        myOwnProperty: { type: 'string' },
   *    }))
   *
   * @type {Object.<string,Object>}
   */
  properties: {
    id: { type: 'string', readOnly: true },
  },

  /**
   * Implemented property types
   *
   * It's in the form of an object whose keys are type names and values
   * are object defining the style.
   *
   * Supported definition options:
   *    - fromServer (function): return the Javascript value from server's ;
   *                             defaults to no conversion
   *                             Can also return a PROMISE.
   *    - toServer (function):  return the server value from Javascript's ;
   *                            defaults to no conversion
   *                            CANNOT return a PROMISE.
   *
   * @type {Object.<string,Object>}
   */
  types: {
    string: scalar,
    integer: scalar,
    'float': scalar,
    'boolean': scalar,
    'enum': scalar,
    date: {
      fromServer: function(dateStr) {
        return dateStr ? new Date(dateStr) : null;
      },
      toServer: function(dateObj) {
        return dateObj ? dateObj.toString() : null;
      }
    },
    array: {
      fromServer: function(value) {
        return value instanceof Array ? value : [];
      },
      toServer: function(value) {
        return value instanceof Array ? value : [];
      }
    },
    hash: scalar,
    refMany: {
      fromServer: function(ar, type) {
        if (!(ar instanceof Array)) { return []; }
        return value.getModule(type.targetModel)
          .then(function(_Class) {
            var store = model.getStore(_Class);
            return async.
              whenAll(ar.filter(function(obj) { return !!obj.id; })
                      .map(function(obj, idx) { return store.getLazyObject(obj); }));
          })
          .then(function(objList) {
            if (type.chained) {
              array.chainArray(objList);
            }
            return objList;
          });
      },
      toServer: function(ar, type) {
        if (!(ar instanceof Array)) { return undefined; }
        return ar.map(
          function(obj) {
            if (!obj.id) {
              console.warn("refMany: toServer() will not cascade on new obj:", obj);
            }
            return { id: obj.id };
          });
      }
    },
    refOne: {
      fromServer: function(obj, type) {
        if (obj === null) { return null; }
        return value.getModule(type.targetModel)
          .then(function(_Class) {
            return model.getStore(_Class).getLazyObject(obj);
          });
      },
      toServer: function(obj, type) {
        // do not cascade: foreign objects have to be saved independantly
        if (obj && !obj.id) {
          console.warn("refOne: toServer() will not cascade on new obj:", obj);
        }

        return obj && obj.id ? { id: obj.id } : null;
      }
    },
    embedMany: {
      fromServer: function(ar, type) { // same as 'refMany'
        if (!(ar instanceof Array)) { return []; }
        return value.getModule(type.targetModel)
          .then(function(_Class) {
            var store = model.getStore(_Class);
            return async.
              whenAll(ar.filter(function(obj) { return !!obj.id; })
                      .map(function(obj) { return store.getLazyObject(obj); }));
          })
          .then(function(objList) {
            if (type.chained) {
              array.chainArray(objList);
            }
            return objList;
          });
      },
      toServer: function(ar, type) {
        if (!(ar instanceof Array)) { return undefined; }
        return whenAll(ar.map(function(item) {
          return item.toServerValue({ allValues: true });
        }));
      }
    }
  },

  /**
   * Store to which this obj belong to
   *
   * @type {geonef/jig/data/model/ModelStore} store
   */
  store: null,

  /**
   * Hash of original values
   *
   * @type {Object}
   */
  originalValues: {},


  constructor: function(options) {
    if (options) {
      lang.mixin(this, options);
    }
    this.originalValues = lang.mixin({}, this.originalValues);
    this.init();
  },

  destroy: function() {
    if (this._subcr) {
      this._subcr.forEach(function(c) { c.remove(); });
      delete this._subcr;
    }
  },

  /**
   * @protected
   */
  init: function() {},

  /** hook */
  initNew: function() {},

  getRef: function() {
    return this.store.idToRef(this.id);
  },

  /**
   * Get value of given property - asynchronous
   *
   * For any "foo" property, the method "getFoo" is checked for existence.
   * That 'getFoo' method can return :
   *    - a dojo/Deferred object, which is then returned as is by "get"
   *    - an immediate value, which is passed as param to next deferred's callback
   *    - undefined, which is the same as if "getFoo" were not defined:
   *                 a request is made through the store to fetch the missing property.
   *
   * @param {string} property   Name of property
   * @return {dojo/Deferred}
   */
  get: function(property) {
    var set, value;
    var ucProp = string.ucFirst(property);
    var meth = 'get' + ucProp;
    if (this[meth]) {
      value = this[meth]();
    } else {
      meth = 'is' + ucProp;
      if (this[meth]) {
        value = this[meth]();
      }
    }
    if (value !== undefined) {
      if (value instanceof Deferred) {
        return value;
      }
      return async.bindArg(value);
    }
    if (this[property] !== undefined || !this.id) {
      return async.bindArg(this[property]);
    }
    return this.store
      .fetchProps(this, [property])
      .then(function(obj) { return obj[property]; });
  },

  /**
   * Request value of differents properties
   *
   * The returned promise will be resolved when the specified properties
   * have been fetched. The callback arg is 'this'.
   *
   * @param {Array.<string>} propArray array of property names
   * @return {dojo/Deferred}
   */
  requestProps: function(propArray) {
    var _this = this;
    return async.bindArg(this, allPromises(
      propArray.map(function(prop) { return _this.get(prop); })));
  },

  /**
   * Set a given property to given value
   *
   * @param {string} property
   * @param any value
   */
  set: function(property, value, setAsOriginal) {
    var setter = this['set'+string.ucFirst(property)];
    if (setter) {
      setter.call(this, value);
    } else {
      this[property] = value;
    }
    if (setAsOriginal) {
      this.setOriginalValue(property, value);
    }
  },

  /**
   * @return {Object} object of all (available) values
   */
  getProps: function() {
    var p;
    var props = this.properties;
    var obj = {};
    for (p in props) {
      if (typeof props[p] == 'object' && props[p].type && this[p] !== undefined) {
        // var typeSpec = props[p];
        // if (includeReadOnly ||
        //     (!typeSpec.readOnly && !typeSpec.noEdit)) {
        obj[p] = this[p];
        // }
      }
    }

    return obj;
  },

  /**
   * Set multiple properties at once
   *
   * @param {Object} object     object of properties/values
   */
  setProps: function(object) {
    for (var p in object) if (object.hasOwnProperty(p)) {
      this.set(p, object[p]);
    }
  },


  /**
   * Get object ID
   *
   * @return {string}
   */
  getId: function() {
    return this.id;
  },

  /**
   * Set object ID - called by ModelStore after new obj is persisted (private use)
   *
   * @param {string} id
   */
  setId: function(id) {
    this.id = id;
  },

  /**
   * Get short string, text summary about the object
   *
   * This would typically return the value of the 'name' or 'title' property.
   *
   * @return {string}
   */
  getSummary: function() {
    return this.getId();
  },

  /**
   * Set properties as fetched from the server
   *
   * @param {Object} props
   * @return {dojo/Deferred}
   */
  fromServerValue: function(props, options) {
    options = object.mixOptions({
      setOriginal: true,
    }, options);

    var _this = this;

    return allPromises(object.map(props, function(prop, p) {
      var typeSpec = this.properties[p];
      if (!typeSpec) {
        return null;
      }

      var type = this.types[typeSpec.type];

      return when(type.fromServer.call(this, prop, typeSpec))
        .then(function(value) {
          _this[p] = value;
          if (options.setOriginal) {
            _this.setOriginalValue(p, prop);
          }
          return value;
        });
    }, this));
  },

  /**
   * Return properties as they should be sent to the server
   *
   * TODO: allow types' toServer() return promises
   *
   * Only JSON-compatible values are valid: Object, Array, String, Numbers, Null.
   * Be careful: no NaN, undefined, or circular-references.
   *
   * The discriminator field, if any, is part of the returned object.
   *
   * Available options:
   *    - setOriginal: mark current values as original
   *    - allValues: Whether non-modified values shall be included
   *
   * @param {!Object} options
   * @return {dojo/Deferred}
   */
  toServerValue: function(options) {
    options = object.mixOptions({
      setOriginal: false,
      allValues: false
    }, options);

    var p, type, _value, _this = this;;
    var props = this.properties;
    var struct = {};
    var originalValues = this.originalValues;
    var deferreds = [];

    if (this.id) {
      struct.id = this.id;
    }
    for (p in props) if (typeof props[p] == 'object' && props[p].type) {
      _value = this[p];
      if (_value !== undefined) {
        var typeSpec = props[p];
        type = this.types[typeSpec.type];
        if (typeSpec.readOnly ||
            (typeSpec.noEdit && this.id)) {
          continue;
        }

        _value = type.toServer.call(this, _value, typeSpec);

        deferreds.push(
          when(_value).then(function(_value) {
            if (_value !== undefined) {
              var original = originalValues[p];

              if (options.allValues ||
                  !value.isSame(_value, originalValues[p])) {
                struct[p] = _value;

                if (options.setOriginal) {
                  _this.setOriginalValue(_value);
                }
              }
            }
          }));
      }
    }

    return whenAll(deferreds).then(function() {
      var discrProp = _this.discriminatorProperty;
      if (options.allValues && discrProp && _this[discrProp]) {
        struct[discrProp] = _this[discrProp];
      }

      return struct;
    });
  },

  setOriginalValue: function(name, _value) {
    this.originalValues[name] = _value;
  },

  /**
   * Create a member object within an EmbedMany property
   *
   * @public
   * @param {string} propName name of embedMany property
   * @param {dojo/Deferred} subObject
   */
  createSub: function(propName, data) {
      var property = this.properties[propName];
    var _this = this;
    return value.getModule(property.targetModel)
      .then(function(TargetModel) { return model.getStore(TargetModel); })
      .then(function(store) {
        return _this.store.apiRequest({
          action: 'createSub', id: _this.id,
          propName: propName, data: data
        }).then(function(resp) {
          return store.getLazyObject(resp.subObject)
            .then(function(sub) {
              _this[propName].push(sub);
              _this.publish(['afterPut']);
              return sub;
            });
        });
      });
  },

  /**
   * Duplicate a member object within an EmbedMany property
   *
   * @public
   * @param {string} propName name of embedMany property
   * @param {dojo/Deferred} subObject
   */
  duplicateSub: function(propName, subObject) {
    var store = subObject.store;
    var _this = this;
    var deferred = this.store.apiRequest({
      action: 'duplicateSub',
      id: this.id,
      propName: propName,
      subId: subObject.id
    }).then(function(resp) { return store.getLazyObject(resp.subObject); })
      .then(function(sub) {
        _this[propName].push(sub);
        _this.publish(['afterPut']);
        return sub;
      });

    _this.publish(['put']);

    return deferred;
  },

  /**
   * Delete a member object from an EmbedMany property
   *
   * @public
   * @param {string} propName name of embedMany property
   * @param {geonef/jig/data/model/Abstract} subObject
   */
  deleteSub: function(propName, subObject) {
    var store = subObject.store;
    var _this = this;
    var deferred = this.store.apiRequest(
      { action: 'deleteSub', id: this.id,
        propName: propName, subId: subObject.id })
      .then(function(resp) {
        var idx = _this[propName].indexOf(subObject);
        if (idx !== -1) {
          _this[propName].splice(idx, 1);
        }
        _this.publish(['afterPut']);

      });

    _this.publish(['put']);

    return deferred;
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
   * Unsubscribe event registered with selfg subscribe()
   */
  unsubscribe: function(_h) {
    var idx = this._subscr.indexOf(_h);
    _h.remove();
    this._subscr.splice(idx, 1);
  },

  publish: function(argsArray) {
    argsArray = argsArray.slice(0);
    argsArray.unshift(this);
    argsArray.unshift(this.channel);
    topic.publish.apply(topic, argsArray);
  },

  afterDuplicate: function() {
  },

  afterDelete: function() {
  },

  declaredClass: module.id

});

});
