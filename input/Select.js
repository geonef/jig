/**
 * Improvement of dijit/form/Select
 *
 * WARNING: does not work well yet
 *
 * Functionality:
 *      - mapping with non-string values
 */
define([
  "module",
  "dojo/_base/declare",
  "dijit/form/Select"
], function(module, declare, Select) {

  var Self = declare(Select, {

    /**
     * Mapping between select values and input values
     *
     * For example:
     *   valueMapping: {
     *     "yes": true,
     *     "no": false
     *   }
     *
     * @type {Object}
     */
    valueMapping: {},

    /**
     * @override
     */
    _getValueAttr: function() {
      var value = this.inherited(arguments);
      // console.log("Select:_getValueAttr, value before", value);
      if (value in this.valueMapping) {
        value = this.valueMapping[value];
      }
      // console.log("Select:_getValueAttr, value after", value);

      return value;
    },

    /**
     * @override
     */
    _setValueAttr: function(value, _arg) {
      // console.log("Select:_setValueAttr", this.name, value, this.valueMapping);
      for (var key in this.valueMapping) {
        if (this.valueMapping[key] === value) {
          value = key;
          break;
        }
      }
      this.getInherited(arguments).call(this, value, _arg);
    },

  });

  Self.Boolean = declare(Self, {

    options: [
      { value: "yes", label: "Oui" },
      { value: "no", label: "Non" },
    ],

    valueMapping: {
      yes: true,
      no: false
    }

  });

  return Self;

});
