

dojo.provide('jig.input.BooleanCheckBox');

// parents
dojo.require('dijit.form.CheckBox');

dojo.declare('jig.input.BooleanCheckBox', [ dijit.form.CheckBox ],
{
  // summary:
  //   Same as dijit.CheckBox, but deals with boolean value
  //

  value: false,

  _getValueAttr: function() {
    return !!this.checked;
  }

});
