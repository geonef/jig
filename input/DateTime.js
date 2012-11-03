define([
         "dojo/_base/declare",
         "dijit/_Widget",
         "dijit/_TemplatedMixin",
         "dijit/_WidgetsInTemplateMixin",

         "dojo/dom-class",

         "dojo/text!./templates/DateTime.html",
         "./DateTextBox",
         "dijit/form/TimeTextBox"
], function(declare, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin,
            domClass,
            template, DateTextBox, TimeTextBox) {


return declare([ _Widget, _TemplatedMixin, _WidgetsInTemplateMixin ],
{
  name: 'date',
  required: false,
  timeEnabled: null,
  templateString: template,

  buildRendering: function() {
    this.inherited(arguments);
  },

  _setRequiredAttr: function(state) {
    this.required = state;
    this.dateInput.attr('required', state);
  },

  _getValueAttr: function() {
    var date = this.dateInput.attr('value');
    if (date instanceof Date && this.timeEnabled) {
      var time = this.timeInput.attr('value');
      if (time instanceof Date) {
        // date = new Date(date.getTime() + time.getTime());
        date.setHours(time.getHours());
        date.setMinutes(time.getMinutes());
      }
    }
    return date;
  },

  _setValueAttr: function(date) {
    this.date = date;
    this.dateInput.attr('value', date);
    if (!(date instanceof Date) ||
        (0 === date.getHours() &&
         0 === date.getMinutes() &&
         0 === date.getSeconds())) {
      this.timeInput.attr('value', null);
      this.disableTime();
    } else {
      var time = date;
      this.timeInput.attr('value', time);
      this.enableTime();
    }
  },

  enableTime: function() {
    this.timeEnabled = true;
    domClass.add(this.domNode, 'time');
    this.onSubChange();
  },

  disableTime: function() {
    this.timeEnabled = false;
    domClass.remove(this.domNode, 'time');
    this.onSubChange();

  },

  isValid: function() {
    return this.dateInput.isValid() && this.timeInput.isValid();
  },

  validate: function() {
    return this.dateInput.validate() && this.timeInput.validate();
  },

  focus: function() {
    this.dateInput.focus();
  },

  onSubChange: function() {
    var date = this.get('value');
    if (!this.date || !date || this.date.getTime() !== date.getTime()) {
      this.date = date;
      this.onChange();
    }
  },

  // hook
  onChange: function() {},

});

});
