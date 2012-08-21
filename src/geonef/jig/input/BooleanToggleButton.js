define([
         "dojo/_base/declare",
         "dijit/form/ToggleButton",
], function(declare, ToggleButton) {


return declare('geonef.jig.input.BooleanToggleButton', ToggleButton,
{
  // summary:
  //   Same as dijit ToggleButton, but act as a boolean input
  //

  name: 'booleanToggle',

  _setValueAttr: function(state) {
    this.attr('checked', state);
  },

  _getValueAttr: function() {
    return this.attr('checked');
  }

});

});
