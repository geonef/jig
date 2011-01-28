
dojo.provide('jig.input.TextBox');

// parents
dojo.require('dijit.form.TextBox');

/**
 * Add some features to dijit.form.TextBox :
 *      - Pressing ENTER triggers onExecute
 *
 * @class
 */
dojo.declare('jig.input.TextBox', [ dijit.form.TextBox ],
{

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
