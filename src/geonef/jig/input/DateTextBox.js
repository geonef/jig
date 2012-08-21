define([
         "dojo/_base/declare",
         "dijit/form/DateTextBox",
], function(declare, DateTextBox) {


return declare('geonef.jig.input.DateTextBox', DateTextBox,
{
  // summary:
  //   Overload dijit DataTextBox to deal with string date value
  //

  timestamp: false,

  _setValueAttr: function(value) {
    /*var newValue = value;
    if (!value) {
      return;
    }*/
    //console.log('set date value', this, value);
    if (typeof value == 'string') {
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
  },

  // _getValueAttr: function() {
  //   console.log('getDateVal', this, arguments);
  //   return this.inherited(arguments);

  //   var value = this.value;
  //   console.log('date value', this, arguments, value);
  //   //value = value.
  //   // if (value) {
  //   //   value = ''+value.getFullYear()+'-'+value.getMonth()+'-'+value.getDate();
  //   // }
  //   return value;
  // }

});

});
