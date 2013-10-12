define([
  "module",
  "dojo/_base/declare",
  "./Action",
  "dojo/dom-class",

], function(module, declare, Action, domClass) {

  return declare(Action, {

    /**
     * @override
     */
    "class": Action.prototype["class"] + " toggle icon",

    /**
     * @override
     */
    noSubmit: true,

    /**
     * Value
     *
     * @type {boolean}
     */
    value: false,

    /**
     * @override
     */
    onExecute: function() {
      this.set("value", !this.value);
    },

    _setValueAttr: function(state) {
      (state ? domClass.add : domClass.remove)(this.domNode, "checked");
      if (state !== this.value) {
        this.value = state;
        this.onChange(state);
      }
    },

    /**
     * Hook
     */
    onChange: function() {},

    declaredClass: module.id

  });

});

