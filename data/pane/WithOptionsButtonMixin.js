/**
 * Mixin to manage an options dropdown button
 */
define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/dom-class",
  "../../button/DropDown",
  "dijit/TooltipDialog",
], function(module, declare, lang, domClass, DropDown, TooltipDialog) {

  var h = lang.hitch;

  return declare(null, {

    optionsButtonExtraClass: "",

    makeDropDownNode: function(title) {
      var _this = this;
      var node = null;
      var options = this.dom(this.makeOptions()).filter(function(o) { return !!o; });

      if (options.length > 0) {
        node = this.dom(
          [DropDown, {
            _attach: 'optionsDD', extraClass: 'icon s24 nolabel gear '+this.optionsButtonExtraClass,
            dropDown: new TooltipDialog({'class': 'jigActionsTooltip jigDataPaneTooltip'}),
            onMouseEnter: h(null, domClass.add, this.domNode, 'overDD'),
            onMouseLeave: h(null, domClass.remove, this.domNode, 'overDD'),
          }]);

        this.dom(
          ['div', { _insert: this.optionsDD.dropDown.containerNode },
           [['h2', {}, title || ""],
            ['div', {'class':'actions'}, options]]]);
      }

      return node;
    },

    // To be overloaded
    makeOptions: function() {
      return [];
    },

    declaredClass: module.id

  });

});
