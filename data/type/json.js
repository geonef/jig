/**
 * JSON types (string, integer, date, array...)
 *
 */
define([
  "module",
], function(module) {

  var goThrough = function(value) { return value; };
  var scalar = function(name) {
    return {
      name: name,
      fromServer: goThrough,
      toServer: goThrough,
    };
  };

  return {
    string: scalar("string"),
    integer: scalar("integer"),
    'float': scalar("float"),
    'boolean': scalar("boolean"),
    'enum': {
      name: "enum",
      fromServer: function(value, def) {
        if (value === undefined) {
          value = null;
        }
        return (!value && def.nullValue) || value;
      },
      toServer: function(value, def) {
        return value === def.nullValue ? null : value;
      },
      isSame: function(v1, v2, def) {
        return v1 === v2 || def.nullValue &&
          (v1 === null && v2 === def.nullValue || v2 === null && v1 === def.nullValue);
      }
    },
    hash: scalar("hash"),
    date: {
      name: "date",
      fromServer: function(dateStr) {
        return dateStr ? new Date(dateStr) : null;
      },
      toServer: function(dateObj) {
        return dateObj ? dateObj.toString() : null;
      }
    },
    array: {
      name: "array",
      fromServer: function(value) {
        return value instanceof Array ? value : [];
      },
      toServer: function(value) {
        return value instanceof Array ? value : [];
      }
    },

  };

});

