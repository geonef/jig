dojo.provide('jig.input.BooleanToggleButton');

// parents
dojo.require('dijit.form.ToggleButton');

dojo.declare('jig.input.BooleanToggleButton', [ dijit.form.ToggleButton ],
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
