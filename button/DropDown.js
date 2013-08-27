define([
  "module", "require",
  "dojo/_base/declare",
  "./Action",
  "dijit/_HasDropDown",

], function(module, require, declare, Action, _HasDropDown) {

  return declare([Action, _HasDropDown], {

    "class": Action.prototype["class"] + " dropDown",

    postCreate: function() {
      this._buttonNode = this.focusNode = this.domNode;
    },

    focus: function() {
      // do nothing (required by _HasDropDown)
    },

    onExecute: function() {
      this.toggleDropDown();
    },

  });

});

