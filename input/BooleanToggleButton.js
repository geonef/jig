define([
  "module",
  "dojo/_base/declare",
  "dijit/form/ToggleButton",
], function(module, declare, ToggleButton) {

  /**
   * Same as dijit/ToggleButton, but act as a boolean input
   */
  return declare(ToggleButton, {
    name: 'booleanToggle',

    _setValueAttr: function(state) {
      this.attr('checked', state);
    },

    _getValueAttr: function() {
      return this.attr('checked');
    },

    declaredClass: module.id

  });

});
