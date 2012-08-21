define([
         "dojo/_base/declare",
         "dijit/form/CheckBox",

         "dojo/_base/lang",
         "dijit/registry",
], function(declare, CheckBox,
            lang, registry) {


return declare('geonef.jig.input.BooleanCheckBox', CheckBox,
{
  // summary:
  //   Same as dijit.CheckBox, but deals with boolean value
  //

  value: false,

  toggleInput: '',

  startup: function() {
    this.inherited(arguments);
    this.updateToggleInput();
  },

  _getValueAttr: function() {
    return !!this.checked;
  },

  _setToggleInputAttr: function(id) {
    this.toggleInput = id;
    if (this._started) {
      this.updateToggleInput();
    }
  },

  updateToggleInput: function() {
    if (this._toggleInputCnt) {
      this._toggleInputCnt.forEach(function(c) { this.disconnect(c); });
      this._toggleInputCnt = undefined;
    }
    if (this.toggleInput) {
      var w = registry.byId(this.toggleInput);
      var savedValue; // static to all calls to the closure below
      var notNull = function(v) { return v !== null && v !== undefined && v !== ''; };
      var updateFromValue = lang.hitch(this,
        function() {
          var value = w.attr('value');
          if (notNull(value)) {
            savedValue = value;
          }
          if (this.checked !== notNull(value)) {
            this.attr('checked', !!value);
          }
        });
      this._toggleInputCnt = [
        this.connect(this, 'onChange',
                     function() {
                       if (!this.checked && !w.attr('disabled')) {
                         var value = w.attr('value');
                         if (notNull(value)) {
                           savedValue = value;
                         }
                         w.attr('value', null);
                       }
                       if (this.checked && w.attr('disabled') && notNull(savedValue)) {
                         w.attr('value', savedValue);
                       }
                       w.attr('disabled', !this.checked);
                     }),
        this.connect(w, 'onChange', updateFromValue)
      ];
      updateFromValue();
    }
  }

});

});
