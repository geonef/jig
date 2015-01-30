/**
 * DialogAction is a "UI-method-independant" action, using dropdown or dialog
 *
 */
define([
  "module",
  "dojo/_base/declare",
  "./Action",
  "./LazyDropDown",

  "dojo/_base/lang",
  "dojo/_base/window",
  "dojo/dom-style",
  "../util/value",
  "../util/async",
], function(module, declare, Action, LazyDropDown,
            lang, window, style, value, async) {

  // depending on screensize, until 800px (Action) or more (LazyDropDown)
  var Parent = window.global.innerWidth <= 800 ? Action : LazyDropDown;

  var mixinPrototype = Parent.prototype.isDropDown ? { // parent is ./DropDown

    // LazyDropDown read as is

  } : { // parent is ./Action

    "class": Parent.prototype["class"] + " dropDown",
    ddOptions: {},

    onExecute: function() {
      var _this = this;
      this.getWidget().then(function(widget) {
        _this.appView.openPane(widget, {
          closeOnClickOut: true,
          dialogWidth: window.global.innerWidth - 60
        });
      });
    },

    getWidget: function() {
      return this.dialogWidget ? async.bindArg(this.dialogWidget) :
        this.widgetCreateFunc().then(async.setProp(this, "dialogWidget"));
    },

    widgetCreateFunc: function() {
      var _this = this;
      return value.getModule(this.ddClass).then(function(_Class) {
        // console.log("this.ddOptions", _this.ddOptions, _Class.prototype.declaredClass);
        var widget = new _Class(lang.mixin({
          appView: _this.appView,
          anchorMode: "dialog",
          closeDialogOnClickOut: true,
        }, _this.ddOptions));
        widget._floatAnchor = true;
        style.set(widget.domNode, _this.ddStyle);
        return widget;
      });
    },
  };

  return declare(Parent, lang.mixin({

    declaredClass: module.id

  }, mixinPrototype));

});
