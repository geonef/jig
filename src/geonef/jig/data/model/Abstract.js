define("geonef/jig/data/model/Abstract", ["dojo", "geonef/jig/util/string"], function(dojo, utilString) {

/**
 * Base class for all models
 *
 * This is the right class to inherit from when building now models.
 * Everything is defined here:
 *      - event channel & publishing
 *      - discriminator property
 *      - the 'id' property which is common to all models
 *      - the supported property types
 *      - data fetching & hydration
 *
 * For a good example of implementing a model, see geonef.jig.data.model.User.
 *
 * @see geonef.jig.data.model
 * @see geonef.jig.data.model.ModelStore
 * @see geonef.jig.data.model.User
 */
dojo.declare('geonef.jig.data.model.Abstract', null,
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
   *    - noEdit (boolean):     whether the property cannot be changed once defined
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
  properties: geonef.jig.data.model.normalizeProperties({
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
    string: {
    },
    integer: {
    },
    'float': {
    },
    'boolean': {
    },
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
        return dojo.isArray(value) ? value : [];
      },
      toServer: function(value) {
        return dojo.isArray(value) ? value : [];
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
    geometry: {
      fromServer: function(wkt) {
        if (!wkt) {
          return null;
        }
        wkt = wkt.replace(/^SRID=4326;/, '');
        var features =  this.store.getWktFormat().read(wkt);
        if (!features) {
          return null;
        }
        if (dojo.isArray(features)) {
          return features.map(function(feature) { return feature.geometry; });
        } else {
          return features.geometry;
        }
      },
      toServer: function(geometry) {
        var wkt = this.store.getWktFormat().extractGeometry(geometry);
        if (!/^SRID=/.test(wkt)) {
          wkt = 'SRID=4326;' + wkt;
        }
        return wkt;
      }
    },
    refMany: {
      fromServer: function(array, type) {
        if (!dojo.isArray(array)) { return []; }
        var _Class = geonef.jig.util.getClass(type.targetModel);
        var store = geonef.jig.data.model.getStore(_Class);
        var list = array
          .filter(function(obj) { return !!obj.id; })
          .map(function(obj) { return store.getLazyObject(obj); });
        if (type.chained) {
          geonef.jig.util.chainArray(list);
        }
        return list;
      },
      toServer: function(array, type) {
        // do not cascade: foreign objects have to be saved independantly
        return undefined;
      }
    },
    refOne: {
      fromServer: function(obj, type) {
        var _Class = geonef.jig.util.getClass(type.targetModel);
        var object = geonef.jig.data.model.getStore(_Class).getLazyObject(obj);
        return object;
      },
      toServer: function(obj, type) {
        // do not cascade: foreign objects have to be saved independantly
        if (obj && !obj.id) {
          console.warn("toServer() on refOne will not cascade (target obj is new)");
        }

        return obj && obj.id ? { id: obj.id } : null;
      }
    },
    // embedMany: {
    //   fromServer: function(obj, type) {
    //     var _Class = geonef.jig.util.getClass(type.targetModel);
    //     var object = geonef.jig.data.model.getStore(_Class).getLazyObject(obj);
    //     return object;
    //   },
    //   toServer: function(obj, type) {
    //   }
    // }
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
      dojo.mixin(this, options);
    }
    this.originalValues = dojo.mixin({}, this.originalValues);
    this.init();
  },

  destroy: function() {
    if (this._subcr) {
      this._subcr.forEach(dojo.unsubscribe);
    }
  },

  /** hook */
  init: function() {},

  /** hook */
  initNew: function() {},

  /**
   * Get value of given property - asynchronous
   *
   * For any "foo" property, the method "getFoo" is checked for existence.
   * That 'getFoo' method can return :
   *    - a dojo.Deferred object, which is then returned as is by "get"
   *    - an immediate value, which is passed as param to next deferred's callback
   *    - undefined, which is the same as if "getFoo" were not defined:
   *                 a query is made through the store to fetch the missing property.
   *
   * @param {string} property   Name of property
   * @return {dojo.Deferred}
   */
  get: function(property) {
    var set, value;
    var ucProp = geonef.jig.util.string.ucFirst(property);
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
      if (value instanceof dojo.Deferred) {
        return value;
      }
      return geonef.jig.util.newResolvedDeferred(value);
    }
    if (this[property] !== undefined || !this.id) {
      // if (!this.id) {
      //   console.log('in case', this, arguments);
      // }
      return geonef.jig.util.newResolvedDeferred(this[property]);
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
    return geonef.jig.util.whenAll(
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
  set: function(property, value) {
    var method = 'set'+geonef.jig.util.string.ucFirst(property);
    if (this[method]) {
      this[method](value);
    } else {
      this[property] = value;
    }
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
    var p, typeN, type, value;
    for (p in props) if (props.hasOwnProperty(p)) {
      typeN = this.properties[p];
      if (typeN) {
        value = props[p];
        var typeSpec = typeN;
        type = this.types[typeSpec.type];
        // console.log('type', p, type, typeSpec);
        if (type.fromServer) {
          value = type.fromServer.call(this, value, typeSpec);
        }
        this.originalValues[p] = value;
        this[p] = value;
      }
    }
  },

  /**
   * Return properties as they should be sent to the server
   *
   * Only JSON-compatible values are valid: Object, Array, String, Numbers, Null.
   * Be careful: no NaN, undefined, or circular-references.
   *
   * The discriminator field, if any, is defined
   *
   * @return {Object}
   */
  toServerValue: function() {
    var p, type, value;
    var props = this.properties;
    var struct = {};
    if (this.id) {
      struct.id = this.id;
    }
    for (p in props) if (dojo.isObject(props[p]) && props[p].type) {
      value = this[p];
      if (value !== undefined) {
        var typeSpec = props[p];
        var original = this.originalValues[p];
        if (typeSpec.readOnly ||
            (typeSpec.noEdit && this.id) ||
            (original !== undefined &&
             (typeSpec.compare ? (typeSpec.compare(value, original) != 0) :
                 value === original))) { continue; }
        type = this.types[typeSpec.type];
        if (type && type.toServer) {
          value = type.toServer.call(this, value, typeSpec);
          if (value === undefined) {
            continue;
          }
        }
        struct[p] = value;
      }
    }

    return struct;
  },

  subscribe: function(channel, callback) {
    if (!this._subscr) {
      this._subscr = [];
    }
    var _h = dojo.subscribe(channel, dojo.hitch(this, callback));
    this._subscr.push(_h);
    return _h;
  },

  unsubscribe: function(_h) {
    var idx = this._subscr.indexOf(_h);
    dojo.unsubscribe(_h);
    this._subscr.splice(idx, 1);
  },

  publish: function(argsArray) {
    argsArray = argsArray.slice(0);
    argsArray.unshift(this);
    dojo.publish(this.channel, argsArray);
  }

});

return geonef.jig.data.model.Abstract;
});
