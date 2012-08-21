define([
         "dojo/_base/declare",
         "dojo/_base/lang",
         "dojo/_base/Deferred",
         "dojo/topic",
         "../model",
         "../../util",
         "../../util/string",
         "../../util/array"
], function(declare, lang, Deferred, topic, model, util, string, array) {


      var goThrough = function(value) { return value; };
      var scalar = {
        fromServer: goThrough,
        toServer: goThrough,
      };


/**
 * Base class for all models
 *
 * This is the right class to inherit from when building now models.
 *
 * Everything is defined here:
 *      - event channel & publishing
 *      - discriminator property
 *      - the 'id' property which is common to all models
 *      - the supported property types
 *      - data fetching & hydration
 *
 * For a good example of implementing a model, see geonef.jig.data.model.User.
 *
 * @module
 * @see geonef/jig/data/model
 * @see geonef/jig/data/model/ModelStore
 */
return declare('geonef.jig.data.model.Abstract', null,
{
  /**
   * Channel on which to publish notifications
   *
   * @type {string} channel
   */
  channel: 'model/default',

  /**
   * Database identifier
   *
   * @type {string} id
   */
  id: undefined,

  /**
   * Name of (string) property to use for the discriminator.
   *
   * See the 'discriminatorMap' property for explanations of this feature.
   *
   * @type {string} discriminatorProperty
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
   *   { test: 'data.model.MyTest', other: 'data.model.MyOther' }
   * Then, the first class is used for objects whose 'type' property is set
   * to "test", the second if the value is "other".
   *
   * This is inspired after Doctrine's discriminatorMap feature.
   * See: http://docs.doctrine-project.org/projects/doctrine-mongodb-odm/en/latest/reference/inheritance-mapping.html
   *
   * @type {Object.<string,string>} discriminatorMap
   */
  discriminatorMap: {},

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
   * geonef.jig.data.model.normalizeProperties.
   *
   * To inherit from a parent Model's properties, use the following syntax:
   *    properties: geonef.jig.data.model.normalizeProperties(
   *      dojo.delegate(geonef.jig.data.model.Abstract.prototype.properties, {
   *        myOwnProperty: { type: 'string' },
   *    }))
   *
   * @type {Object.<string,Object>} properties
   */
  properties: model.normalizeProperties({
    id: { type: 'string', readOnly: true },
  }),

  /**
   * Implemented property types
   *
   * It's in the form of an object whose keys are type names and values
   * are object defining the style.
   *
   * Supported definition options:
   *    - fromServer (function): return the Javascript value from server's ;
   *                             defaults to no conversion
   *    - toServer (function):  return the server value from Javascript's ;
   *                            defaults to no conversion
   *
   * @type {Object.<string,Object>} types
   */
  types: {
    string: scalar,
    integer: scalar,
    'float': scalar,
    'boolean': scalar,
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
    location: {
      fromServer: function(obj) {
        return new OpenLayers.LonLat(obj.longitude, obj.latitude);
      },
      toServer: function(lonLat) {
        return { longitude: lonLat.lon, latitude: lonLat.lat };
      }
    },
    refMany: {
      fromServer: function(array, type) {
        if (!(array instanceof Array)) { return []; }
        var _Class = util.getClass(type.targetModel);
        var store = model.getStore(_Class);
        var list = array
          .filter(function(obj) { return !!obj.id; })
          .map(function(obj, idx) {
                 return store.getLazyObject(obj);
               });
        if (type.chained) {
          array.chainArray(list);
        }
        return list;
      },
      toServer: function(array, type) {
        if (!(array instanceof Array)) { return undefined; }
        return array.map(
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
        var _Class = util.getClass(type.targetModel);
        var object = model.getStore(_Class).getLazyObject(obj);
        return object;
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
      fromServer: function(array, type) { // same as 'refMany'
        if (!(array instanceof Array)) { return []; }
        var _Class = util.getClass(type.targetModel);
        var store = model.getStore(_Class);
        var list = array
          .filter(function(obj) { return !!obj.id; })
          .map(function(obj) { return store.getLazyObject(obj); });
        if (type.chained) {
          array.chainArray(list);
        }
        return list;
      },
      toServer: function(array, type) {
        if (!(array instanceof Array)) { return undefined; }
        return array.map(function(item) {
                           return item.toServerValue({ allValues: true });
                         });
      }
    }
  },

  /**
   * Store to which this obj belong to
   *
   * @type {geonef.jig.data.model.ModelStore} store
   */
  store: null,

  /**
   * Hash of original values
   *
   * @type {Object} originalValues
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

  /** hook */
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
   *    - a dojo.Deferred object, which is then returned as is by "get"
   *    - an immediate value, which is passed as param to next deferred's callback
   *    - undefined, which is the same as if "getFoo" were not defined:
   *                 a request is made through the store to fetch the missing property.
   *
   * @param {string} property   Name of property
   * @return {dojo.Deferred}
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
      return util.newResolvedDeferred(value);
    }
    if (this[property] !== undefined || !this.id) {
      // if (!this.id) {
      //   console.log('in case', this, arguments);
      // }
      return util.newResolvedDeferred(this[property]);
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
   * @return {dojo.Deferred}
   */
  requestProps: function(propArray) {
    var self = this;
    return util.whenAll(
      propArray.map(function(prop) { return self.get(prop); }))
    .then(function(props) {
            return self;
          });
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
   */
  fromServerValue: function(props) {
    var p, typeN, type, value, serverValue;
    for (p in props) if (props.hasOwnProperty(p)) {
      typeN = this.properties[p];
      if (typeN) {
        serverValue = props[p];
        var typeSpec = typeN;
        type = this.types[typeSpec.type];
        // console.log('type', p, type, typeSpec);
        if (type.fromServer) {
          value = type.fromServer.call(this, serverValue, typeSpec);
        }
        this[p] = value;
        this.setOriginalValue(p, serverValue);
      }
    }
  },

  /**
   * Return properties as they should be sent to the server
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
   * @return {Object}
   */
  toServerValue: function(options) {
    var p, type, value;
    var props = this.properties;
    var struct = {};
    options = lang.mixin({ setOriginal: false, allValues: false }, options);
    if (this.id) {
      struct.id = this.id;
    }
    for (p in props) if (typeof props[p] == 'object' && props[p].type) {
      value = this[p];
      if (value !== undefined) {
        var typeSpec = props[p];
        type = this.types[typeSpec.type];
        if (typeSpec.readOnly ||
            (typeSpec.noEdit && this.id)) {
          continue;
        }

        value = type.toServer.call(this, value, typeSpec);
        if (value !== undefined) {
          var original = this.originalValues[p];
          // console.log('value, original', p, value, original, geonef.jig.util.isSame(value, original));

          if (options.allValues ||
              !util.isSame(value, this.originalValues[p])) {
            struct[p] = value;

            if (options.setOriginal) {
              this.setOriginalValue(value);
            }
          }
        }
      }
    }

    var discrProp = this.discriminatorProperty;
    if (options.allValues && discrProp && this[discrProp]) {
      struct[discrProp] = this[discrProp];
    }

    return struct;
  },

  setOriginalValue: function(name, value) {
    this.originalValues[name] = value;
  },

  /**
   * Create a member object within an EmbedMany property
   *
   * @public
   * @param {string} propName name of embedMany property
   * @param {geonef.jig.data.model.Abstract} subObject
   */
  createSub: function(propName, data) {
    var property = this.properties[propName];
    var store = model.getStore(util.getClass(property.targetModel));
    var _this = this;
    var deferred = this.store.apiRequest(
      { action: 'createSub', id: this.id,
        propName: propName, data: data })
      .then(function(resp) {
              var sub = store.getLazyObject(resp.subObject);
              _this[propName].push(sub);
              _this.publish(['afterPut']);

              return sub;
            });

    _this.publish(['put']);

    return deferred;
  },

  /**
   * Duplicate a member object within an EmbedMany property
   *
   * @public
   * @param {string} propName name of embedMany property
   * @param {geonef.jig.data.model.Abstract} subObject
   */
  duplicateSub: function(propName, subObject) {
    var store = subObject.store;
    var _this = this;
    var deferred = this.store.apiRequest(
      { action: 'duplicateSub', id: this.id,
        propName: propName, subId: subObject.id })
      .then(function(resp) {
              var sub = store.getLazyObject(resp.subObject);
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
   * @param {geonef.jig.data.model.Abstract} subObject
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
    console.log('model.Abstract::subscribe', this, arguments);
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

  publish: function(argsArray) {
    // console.log('publish', this.channel, argsArray);
    argsArray = argsArray.slice(0);
    argsArray.unshift(this);
    argsArray.unshift(this.channel);
    topic.publish.apply(topic, argsArray);
  },

  afterDuplicate: function() {
  },

  afterDelete: function() {
  },


});

});
