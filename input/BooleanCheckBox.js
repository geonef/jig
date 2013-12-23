define([
  "module",
  "dojo/_base/declare",
  "dijit/form/CheckBox",

  "dojo/_base/lang",
  "dojo/aspect",
  "dijit/registry",
], function(module, declare, CheckBox,
            lang, aspect, registry) {


  /**
   * Same as dijit/CheckBox, but deals with boolean value
   *
   * dijit/form/CheckBox deals with the HTML way (string value),
   * which is usually not what we want
   */
  return declare(CheckBox, {
    value: false,

    /**
     * id of input widget to disable according to checkbox state
     *
     * If provided, the corresponding widget is disabled when this checkbox
     * is set to false. (disabled in the sense of .set('disable', true))
     */
    toggleInput: '',

    toggleInputInverse: false,

    postMixInProperties: function() {
      this.inherited(arguments);
      this.checked = this.value;
    },

    destroy: function() {
      this.cleanToggleInput();
      this.inherited(arguments);
    },

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
      this.cleanToggleInput();
      if (this.toggleInput) {
        var w = registry.byId(this.toggleInput);
        if (!w) {
          console.warn("widget ID not found: ", this.toggleInput);
          return;
        }
        var savedValue; // static to all calls to the closure below
        var notNull = function(v) { return v !== null && v !== undefined && v !== ''; };
        var _this = this;

        function isChecked() {
          return _this.toggleInputInverse ? !_this.checked : _this.checked;
        }

        var updateFromValue = lang.hitch(this, function() {
          var value = w.attr('value');
          if (notNull(value)) {
            savedValue = value;
          }
          if (isChecked() !== notNull(value)) {
            this.attr('checked', _this.toggleInputInverse ? !value : !!value);
          }
        });

        this._toggleInputCnt = [

          // Hook on our changes
          aspect.before(this, 'onChange', function() {

            if (!isChecked() && !w.attr('disabled')) {
              var value = w.attr('value');
              if (notNull(value)) {
                savedValue = value;
              }
              w.attr('value', null);
            }
            if (isChecked() && w.attr('disabled') && notNull(savedValue)) {
              w.attr('value', savedValue);
            }
            w.attr('disabled', !isChecked());
          }),

          // Hook on target widget change
          aspect.before(w, 'onChange', updateFromValue)
        ];
        updateFromValue();
      }
    },

    cleanToggleInput: function() {
      if (this._toggleInputCnt) {
        this._toggleInputCnt.forEach(function(c) { c.remove(); });
        this._toggleInputCnt = undefined;
      }
    },

    declaredClass: module.id

  });

});
