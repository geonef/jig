
dojo.provide('geonef.jig.input.TextBox');

// parents
dojo.require('dijit.form.ValidationTextBox');

dojo.require('geonef.jig.util');


/**
 * Add some features to dijit.form.TextBox :
 *      - Pressing ENTER triggers onExecute
 *
 * @class
 */
dojo.declare('geonef.jig.input.TextBox', dijit.form.ValidationTextBox,
{

  trim: true,

  noSubmit: false,


  postCreate: function() {
    this.inherited(arguments);
    dojo.query('input.dijitValidationInner',
               this.domNode)[0].setAttribute('disabled', 'disabled');
    this.textbox.setAttribute('autocomplete', 'on');
    this.connect(this.textbox, 'onkeydown', this._jigOnKeyDown);
    // this.connect(this.textbox, 'onkeypress', this._jigOnKeyPress);
  },

  /**
   * Intercept ENTER key to call onExecute
   */
  _jigOnKeyDown: function(e) {
    if (e && e.keyCode === dojo.keys.ENTER) {
      dojo.stopEvent(e);
      var ret = this.onExecute();
      if (ret !== false && !this.noSubmit) {
        var domNode = this.domNode;
        // the timeout is need to avoid bad key event being
        // sent, for example caught by the DD button controlling
        // a TooltipDialog containing this textbox.
        geonef.jig.util.whenTimeout(10)
          .then(function() {
                  geonef.jig.util.bubbleSubmit(domNode, e);
                });
      }
    }
  },

  onExecute: function() {
    // hook
  }

});
