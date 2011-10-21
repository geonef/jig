define("geonef/jig/data/model/Abstract", ["dojo"], function(dojo) {

/**
 * Base for model classes
 *
 */
dojo.declare('geonef.jig.data.model.Abstract', null,
{
  /**
   * Channel on which to publish notifications
   */
  channel: 'model/default',

  /**
   * @type {string} ID
   */
  id: null,

  properties: {
    id: 'string',
  },

  types: {
    string: {
    },
    integer: {
    },
    date: {
      fromServer: function(dateStr) {
        return dateStr ? new Date(dateStr) : null;
      },
      toServer: function(dateObj) {
        return dateObj ? dateObj.toString() : null;
      }
    }
  },

  /**
   * @type {geonef.jig.data.model.ModelStore} store to which this obj belong to
   */
  store: null,

  constructor: function(options) {
    if (options) {
      dojo.mixin(this, options);
    }
  },

  /**
   * Get object ID
   */
  getId: function() {
    return this.id;
  },

  /**
   * Set object ID - called by ModelStore after new obj is persisted
   */
  setId: function(id) {
    this.id = id;
  },

  /**
   * @return {string} short string, text summary about the object
   */
  getSummary: function() {
    return this.getId();
  },

  /**
   * Set properties as fetched from the server
   */
  fromServerValue: function(props) {
    var p, typeN, type, value;
    for (p in props) if (props.hasOwnProperty(p)) {
      typeN = this.properties[p];
      if (typeN) {
        value = props[p];
        type = this.types[typeN];
        if (type.fromServer) {
          value = type.fromServer(value);
        }
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
   * @return {Object}
   */
  toServerValue: function() {
    var p, type, value;
    var props = this.properties;
    var struct = {};
    for (p in props) if (props.hasOwnProperty(p)) {
      value = this[p];
      type = this.types[props[p]];
      if (type && type.toServer) {
        value = type.toServer(value);
      }
      struct[p] = value;
    }

    return struct;
  },

  publish: function(argsArray) {
    argsArray = argsArray.slice(0);
    argsArray.push(this);
    dojo.publish(this.channel, argsArray);
  }

});

return geonef.jig.data.model.Abstract;
});
