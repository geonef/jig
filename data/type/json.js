/**
 * JSON types (string, integer, date, array...)
 *
 */
define([
  "module",
  "geonef/jig/util/string"
], function(module, string) {

  var goThrough = function(value) { return value; };
  var scalar = function(name) {
    return {
      name: name,
      fromServer: goThrough,
      toServer: goThrough,
      buildLabelNode: function(value, def) {
        return ["span", {}, string.escapeHtml(value)];
      }
    };
  };

  return {
    string: scalar("string"),
    integer: scalar("integer"),
    'float': scalar("float"),
    'boolean': scalar("boolean"),
    bool: scalar("boolean"),
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
      },
      buildLabelNode: function(value, def) {
        var key = value || def.nullValue || def.defaultValue;
        value = def.values[key] || "";
        value = string.escapeHtml(value);
        if (def.icons && def.icons[key]) {
          value = '<img src="'+require.toUrl(def.icons[key])+'"/> ' + value;
        }
        return ["span", {}, value];
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
        return value === null ? null :
          (value instanceof Array ? value : []);
      },
      toServer: function(value) {
        return value === null ? null :
          (value instanceof Array ? value : []);
      }
    },

  };

});
