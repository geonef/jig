
dojo.provide('geonef.jig.input.TextBox');

// parents
dojo.require('dijit.form.ValidationTextBox');

/**
 * Add some features to dijit.form.TextBox :
 *      - Pressing ENTER triggers onExecute
 *
 * @class
 */
dojo.declare('geonef.jig.input.TextBox', dijit.form.ValidationTextBox,
{

  trim: true,


  postCreate: function() {
    this.inherited(arguments);
    this.connect(this.textbox, 'onkeydown', this._jigOnKeyDown);
  },

  /**
   * Intercept ENTER key to call onExecute
   */
  _jigOnKeyDown: function(e) {
    if (e && e.keyCode && e.keyCode === dojo.keys.ENTER) {
      this.onExecute();
    }
  },

  onExecute: function() {
    // hook
  },


});
