define([
         "dojo/_base/declare",
         "dijit/form/ToggleButton",
], function(declare, ToggleButton) {

/**
 * Same as dijit.ToggleButton, but act as a boolean input
 */
return declare('geonef.jig.input.BooleanToggleButton', ToggleButton,
{
  name: 'booleanToggle',

  _setValueAttr: function(state) {
    this.attr('checked', state);
  },

  _getValueAttr: function() {
    return this.attr('checked');
  }

});

});
