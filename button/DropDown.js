define([
  "module",
  "dojo/_base/declare",
  "./Action",
  "dijit/_HasDropDown",
  "dojo/has",
  "dojo/on",
  "dijit/focus",

], function(module, declare, Action, _HasDropDown, has, on, dijitFocus) {

  return declare([Action, _HasDropDown], {

    /**
     * @override
     */
    "class": Action.prototype["class"] + " dropDown",

    /**
     * @override
     */
    noSubmit: true,

    toggleOnTouchStart: false,
    toggleOnTouchStop: true,

    /**
     * Tell others that we are a dropdown class
     */
    isDropDown: true,

    /**
     * @override
     */
    postCreate: function() {
      this._buttonNode = this.focusNode = this.domNode;
      this.inherited(arguments);
      // var _this = this;
      // if (this.toggleOnTouchStart) {
      //   this.own(on(this.domNode, "touchstart", function(e) {
      //     _this.toggleDropDown();
      //   }));
      // }
      // if (this.toggleOnTouchStop) {
      //   this.own(on(this.domNode, "touchstop", function(e) {
      //     _this.toggleDropDown();
      //   }));
      // }
    },

    // Required by _HasDropDown
    focus: function() {
      dijitFocus.focus(this.domNode);
    },

    // no "onExecute" callback - managed by mouse/key events of _HasDropDown
    // onExecute: function() {},

    declaredClass: module.id

  });

});
