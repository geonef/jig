
dojo.provide('jig.input.DateTextBox');

// parents
dojo.require('dijit.form.DateTextBox');

dojo.declare('jig.input.DateTextBox', dijit.form.DateTextBox,
{
  // summary:
  //   Overload dijit DataTextBox to deal with string date value
  //

  _setValueAttr: function(value) {
    var newValue = value;
    if (!value) {
      return;
    }
    console.log('set date value', this, value, newValue);
    if (dojo.isString(value)) {
      var _t = value.split('Z');
      newValue = new Date(_t[0]);
    }
    dijit.form._DateTimeTextBox.prototype._setValueAttr.call(this, newValue);
  }/*,

  _getValueAttr: function() {
    var value = this.value;
    if (value) {
      value = ''+value.getFullYear()+'-'+value.getMonth()+'-'+value.getDate();
    }
    console.log('get date value', this, this.value, value);
    return value;
  }*/

});
