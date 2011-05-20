
dojo.provide('geonef.jig.input.DateTextBox');

// parents
dojo.require('dijit.form.DateTextBox');

dojo.declare('geonef.jig.input.DateTextBox', dijit.form.DateTextBox,
{
  // summary:
  //   Overload dijit DataTextBox to deal with string date value
  //

  _setValueAttr: function(value) {
    /*var newValue = value;
    if (!value) {
      return;
    }*/
    //console.log('set date value', this, value);
    if (dojo.isString(value)) {
      var displayValue = value.replace(/Z/, '').replace(/-/g, '/');
      //this.attr('displayValue', displayValue);
      var date = new Date(displayValue);
      //console.log('setting value', date, displayValue);
      this.attr('value', date);
    } else {
      this.inherited(arguments);
    }
    //this.inherited([newValue]);
    //dijit.form._DateTimeTextBox.prototype._setValueAttr.call(this, newValue);
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
