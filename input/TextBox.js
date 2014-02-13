define([
  "module",
  "dojo/_base/declare",
  "dijit/form/ValidationTextBox",
  "./_TextMixin",
  "dojo/query",
], function(module, declare, ValidationTextBox, _TextMixin, query) {


  /**
   * Add some features to dijit/form/TextBox :
   *      - Pressing ENTER triggers onExecute
   *      - autoExecute
   *
   * @class
   */
  return declare([ValidationTextBox, _TextMixin], {

    postCreate: function() {
      this.inherited(arguments);
      query('input.dijitValidationInner', this.domNode)[0]
        .setAttribute('disabled', 'disabled');
    },

    declaredClass: module.id

  });

});
