/**
 * Improvement of dijit/form/Select
 *
 * WARNING: does not work well yet
 *
 * Functionality:
 *      - mapping with non-string values
 */
define([
  "module",
  "dojo/_base/declare",
  "../button/DropDown",
  "dijit/TooltipDialog",
  "../button/Action",

  "dojo/_base/lang",
  "../util/makeDOM",
], function(module, declare, DropDown, TooltipDialog, Action,
            lang, makeDOM) {

  return declare(DropDown, {

    options: [],

    actionOptions: {
      extraClass: "selectOption"
    },

    /**
     * @override
     */
    "class": DropDown.prototype["class"] + " jigInputSelectDropDown",

    /**
     * @override
     */
    postMixInProperties: function() {
      this.inherited(arguments);
      this.dropDown = new TooltipDialog({"class":"jigInputSelectDropDownTooltip"});
    },

    // TODO: clean buttons
    _setOptionsAttr: function(options) {
      this.options = options;
      var node = this.dropDown.containerNode;
      node.innerHTML = "";
      if (options) {
        makeDOM(["div", {_insert: node}, options.map(function(option) {
          return [Action, lang.mixin({
            label: option.label,
            onExecute: lang.hitch(this, this.set, "value", option.value)
          }, this.actionOptions)];
        }, this)]);
      }
    },

    _setValueAttr: function(value) {
      var option = this.valueToOption(value);
      this.value = option && option.value;
      this.set("label", option ? (option.buttonLabel || option.label) : "?");
      this.onChange();
    },

    valueToOption: function(value) {
      var options = this.options;
      if (options) {
        for (var i = 0; i < options.length; i++) {
          if (options[i].value === value) {
            return options[i];
          }
        }
      }
      return null;
    },

    onChange: function() {
    },

    declaredClass: module.id

  });

});
