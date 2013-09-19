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
        return (!value && def.nullValue) || value;
      },
      toServer: function(value, def) {
        return value === def.nullValue ? null : value;
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

