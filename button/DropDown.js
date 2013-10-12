define([
  "module",
  "dojo/_base/declare",
  "./Action",
  "dijit/_HasDropDown",

], function(module, declare, Action, _HasDropDown) {

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
    },

    focus: function() {
      // do nothing (required by _HasDropDown)
    },

    /**
     * @override
     */
    onExecute: function() {
      this.toggleDropDown();
    },

  });

});

