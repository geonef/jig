define([
  "module",
  "dojo/_base/declare",
  "./Action",
  "dijit/_HasDropDown",
  "dijit/focus",

], function(module, declare, Action, _HasDropDown, dijitFocus) {

  return declare([Action, _HasDropDown], {

    /**
     * @override
     */
    "class": Action.prototype["class"] + " dropDown",

    /**
     * @override
     */
    noSubmit: true,


    /**
     * @override
     */
    postCreate: function() {
      this._buttonNode = this.focusNode = this.domNode;
      this.inherited(arguments);
    },

    // Required by _HasDropDown
    focus: function() {
      dijitFocus.focus(this.domNode);
    },

    // no "onExecute" callback - managed by mouse/key events of _HasDropDown

    declaredClass: module.id

  });

});
