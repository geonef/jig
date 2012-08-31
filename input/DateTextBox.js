define([
         "dojo/_base/declare",
         "dijit/form/DateTextBox",
], function(declare, DateTextBox) {

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

  _setValueAttr: function(value) {
    if (typeof value == 'string') {
      var displayValue = value.replace(/Z/, '').replace(/-/g, '/');
      var date = new Date(displayValue);
      this.attr('value', date);
    } else {
      this.inherited(arguments);
    }
  }

});

});
