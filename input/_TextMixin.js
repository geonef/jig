define([
  "module",
  "dojo/_base/declare",
  "dijit/form/ValidationTextBox",

  "dojo/_base/event",
  "dojo/keys",
  "../util/widget",
  "../util/async"
], function(module, declare, ValidationTextBox,
            event, keys, widget, async) {


  /**
   * Add some features to dijit/form/TextBox and Textarea:
   *      - Pressing ENTER triggers onExecute
   *      - autoExecute
   *
   * @class
   */
  return declare(null, {

    trim: true,

    noSubmit: false,

    executeKey: keys.ENTER,
    executeKeyMod: null,

    autoExecute: false,

    autoExecuteDelay: 800,

    postMixInProperties: function() {
      this.inherited(arguments);
      if (this.autoExecute) {
        this.intermediateChanges = true;
      }
    },

    postCreate: function() {
      this.inherited(arguments);
      this.textbox.setAttribute('autocomplete', 'on');
      this.connect(this.textbox, 'onkeydown', this._jigOnKeyDown);
      // this.connect(this.textbox, 'onkeypress', this._jigOnKeyPress);
    },

    /**
     * Intercept ENTER key to call onExecute
     */
    _jigOnKeyDown: function(e) {
      if (e && e.keyCode === this.executeKey &&
          (!this.executeKeyMod || e[this.executeKeyMod+"Key"])) {
        event.stop(e);
        var ret = (!this.validate || this.validate()) && this.onExecute();
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
    },

    onChange: function() {
      if (this.autoExecute) {
        this.resetAutoExecuteTimer();
      }
    },

    resetAutoExecuteTimer: function() {
      // console.log("resetAutoExecuteTimer", this, arguments);
      var _this = this;
      if (this.autoExecutePromise) {
        // console.log("this.autoExecutePromise", this.autoExecutePromise);
        this.autoExecutePromise.cancel();
      }
      this.autoExecutePromise =
        async.whenTimeout(this.autoExecuteDelay)
        .then(function() {
          _this.autoExecutePromise = null;
          _this.onExecute();
        });
    },

    declaredClass: module.id

  });

});
