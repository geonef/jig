dojo.provide('geonef.jig.input.DateTime');

// parents
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');

// used in template
dojo.require('geonef.jig.input.DateTextBox');
dojo.require('dijit.form.TimeTextBox');


dojo.declare('geonef.jig.input.DateTime', [ dijit._Widget, dijit._Templated ],
{
  name: 'date',
  required: false,
  timeEnabled: null,
  templateString: dojo.cache('geonef.jig.input', 'templates/DateTime.html'),
  widgetsInTemplate: true,

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
    dojo.addClass(this.domNode, 'time');
  },

  disableTime: function() {
    this.timeEnabled = false;
    dojo.removeClass(this.domNode, 'time');

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


  // hook
  onChange: function() {},


});
