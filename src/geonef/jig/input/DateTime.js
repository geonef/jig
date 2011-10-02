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

  _getValueAttr: function() {
    var date = this.dateInput.attr('value');
    if (date instanceof Date && this.timeEnabled) {
      var time = this.timeInput.attr('value');
      if (time instanceof Date) {
        date = new Date(date.getTime() + time.getTime());
      }
    }
    return date;
  },

  _setValueAttr: function(date) {
    console.log('_setValueAttr', this, arguments);
    this.date = date;
    this.dateInput.attr('value', date);
    console.log('date', date);
    if (!(date instanceof Date) ||
        0 === date.getHours() === date.getMinutes() === date.getSeconds()) {
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


  // hook
  onChange: function() {},


});
