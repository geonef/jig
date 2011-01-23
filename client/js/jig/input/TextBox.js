
dojo.provide('jig.input.TextBox');

// parents
dojo.require('dijit.form.TextBox');

/**
 * Add some features to dijit.form.TextBox
 *
 * @class
 */
dojo.declare('jig.input.TextBox', [ dijit.form.TextBox ],
{

  /**
   * Intercept ENTER key to call onExecute
   */
  _onInput: function() {
    this.inherited(arguments);
    if (e && e.type && /key/i.test(e.type) && e.keyCode){
      switch(e.keyCode){
          case dojo.keys.ENTER:
            this.onExecute();
            return;
      }
    }
    this.inherited(arguments);
  },

  onExecute: function() {
    // hook
  },


});
