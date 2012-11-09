define([
  "dojo/_base/declare",
  "dijit/form/DateTextBox",
  "dojo/date/stamp",
], function(declare, DateTextBox, stamp) {

/**
 * Extension of dijit.DataTextBox to deal with string date value
 *
 * It is used in the same way, except that it will work when set with
 * a string date value.
 *
 * The value getter is unchanged and returns a Date object.
 */
return declare('geonef.jig.input.DateTextBox', DateTextBox,
{

  timestamp: false,
  autoSerialize: false,

  _setValueAttr: function(value) {
    if (typeof value == 'string') {
      // var displayValue = value.replace(/Z/, '').replace(/-/g, '/');
      var displayValue = value;
      // var date = new Date(displayValue);
      var date = stamp.fromISOString(displayValue);
      console.log("pajzodi jazoijd", date, displayValue);
      this.attr('value', date);
    } else {
      this.inherited(arguments);
    }
  },

  _getValueAttr: function() {
    var value = this.inherited(arguments);
    if (value && this.autoSerialize) {
      value = this.serialize(value);
    }
    return value;
  }

});

});
