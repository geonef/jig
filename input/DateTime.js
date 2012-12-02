/**
 * Input combining date and optional time
 *
 */
define([
  "module",
  "dojo/_base/declare",
  "geonef/jig/_Widget",
  "dojo/_base/lang",
  "dojo/dom-class",

  "./DateTextBox",
  "dijit/form/TimeTextBox",
  "../button/Action",
], function(module, declare, _Widget, lang, domClass,
            DateTextBox, TimeTextBox, Action) {

  var h = lang.hitch;

return declare(_Widget, { //--noindent--
  name: 'date',
  required: false,
  timeEnabled: false,
  nodeName: "table",
  "class": "jigInputDateTime",

  datePromptMessage: null,
  dateMissingMessage: null,
  timePromptMessage: null,

  /**
   * @override
   */
  makeContentNodes: function() {
    return [
      ["tbody", {}, ["tr", {}, [
        ["td", {}, [
          [DateTextBox, {
            _attach: "dateInput",
            onChange: h(this, this.onSubChange),
            tooltipPosition: ["above", "below"],
            promptMessage: this.datePromptMessage,
            missingMessage: this.dateMissingMessage,
          }]
        ]],
        ["td", {"class": "noTimeOnly"}, [
          [Action, {
            label: "Heure...",
            onExecute: h(this, this._setTimeEnabledAttr, true, true)
          }]
        ]],
        ["td", {"class": "timeOnly"}, [
          [TimeTextBox, {
            _attach: "timeInput",
            onChange: h(this, this.onSubChange),
            tooltipPosition: ["above", "below"],
            promptMessage: this.timePromptMessage,
          }]
        ]],
        ["td", {"class": "timeOnly"}, [
          [Action, {
            label: "Retirer l'heure",
            onExecute: h(this, this._setTimeEnabledAttr, false, true)
          }]
        ]]
      ]]]
    ];
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
    // console.log("value", date, date instanceof Date);
    if (date instanceof Date &&
        (date.getHours() > 0 ||
         date.getMinutes() > 0 ||
         date.getSeconds() > 0)) {
      this.timeInput.attr('value', date);
      this.set("timeEnabled", true);
    } else {
      this.timeInput.attr('value', null);
      this.set("timeEnabled", false);
    }
  },

  _setTimeEnabledAttr: function(enabled, showHideDD) {
    console.log("_setTimeEnabledAttr", this, arguments);
    this.timeEnabled = enabled;
    (enabled ? domClass.add : domClass.remove)(this.domNode, 'time');
    this.onSubChange();
    if (showHideDD) {
      if (enabled) {
        this.timeInput.openDropDown();
      } else {
        this.timeInput.closeDropDown();
      }
    }
  },

  isValid: function() {
    // console.log("isValid", this, arguments);
    return this.dateInput.isValid() && this.timeInput.isValid();
  },

  validate: function() {
    // console.log("Validate", this.dateInput.isValid());
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

  declaredClass: module.id

});

});
