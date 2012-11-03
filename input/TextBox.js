define([
         "dojo/_base/declare",
         "dijit/form/ValidationTextBox",

         "dojo/_base/event",
         "dojo/query",
         "dojo/keys",
         "../util/widget",
         "../util/async"
], function(declare, ValidationTextBox,
            event, query, keys, widget, async) {


/**
 * Add some features to dijit/form/TextBox :
 *      - Pressing ENTER triggers onExecute
 *
 * @class
 */
return declare(ValidationTextBox,
{

  trim: true,

  noSubmit: false,


  postCreate: function() {
    this.inherited(arguments);
    query('input.dijitValidationInner',
          this.domNode)[0].setAttribute('disabled', 'disabled');
    this.textbox.setAttribute('autocomplete', 'on');
    this.connect(this.textbox, 'onkeydown', this._jigOnKeyDown);
    // this.connect(this.textbox, 'onkeypress', this._jigOnKeyPress);
  },

  /**
   * Intercept ENTER key to call onExecute
   */
  _jigOnKeyDown: function(e) {
    if (e && e.keyCode === keys.ENTER) {
      event.stop(e);
      var ret = this.onExecute();
      if (ret !== false && !this.noSubmit) {
        var domNode = this.domNode;
        // the timeout is need to avoid bad key event being
        // sent, for example caught by the DD button controlling
        // a TooltipDialog containing this textbox.
        async.whenTimeout(10)
          .then(function() {
                  widget.bubbleSubmit(domNode, e);
                });
      }
    }
  },

  onExecute: function() {
    // hook
  }

});

});
