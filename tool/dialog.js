/**
 */
define([
  "module", "dojo/_base/declare",
  "geonef/jig/_Widget",
  "dojo/_base/lang",
  "dojo/Deferred",
  "geonef/jig/button/Action",
  "dojo/dom-construct",
  "dijit/Dialog",
], function(module, declare, _Widget, lang, Deferred, Action, construct, Dialog) {

  var h = lang.hitch;

  var _Dialog = declare(Dialog, {

    value: null,
    rejectionValue: false,

    // postMixInProperties: function() {
    //   this.inherited(arguments);
    //   this.promise = new Deferred();
    // },

    show: function() {
      this.promise = new Deferred();

      this.inherited(arguments);

      return this.promise;
    },

    hide: function() {
      var _this = this;
      return this.inherited(arguments).then(function(arg) {
        if (_this.value === _this.rejectionValue) {
          _this.promise.reject();
        } else {
          _this.promise.resolve(_this.value);
        }
        // _this.destroy();
        return arg;
      });
    }

  });

  var _ConfirmWidget = declare(_Widget, {

    /**
     * Confirmation message
     */
    message: "Êtes-vous sûr ?",

    "class": _Widget.prototype["class"] + " jigDialog",

    confirmLabel: "Confirmer",
    cancelLabel: "Annuler",

    postMixInProperties: function() {
      this.inherited(arguments);
      this.promise = new Deferred();
    },

    /**
     * @override
     */
    makeContentNodes: function() {
      return [
        ["p", {}, this.makeMessageNode()],
        ["div", {"class":"actions geonefActions"}, this.makeActionNodes()],
      ];
    },

    makeMessageNode: function() {
      return this.message;
    },

    makeActionNodes: function() {
      return [
        [Action, {
          label: this.confirmLabel,
          extraClass: "primary", noConfirm: true,
          onExecute: h(this, this.action, true)
        }],
        ['span', {}, " "],
        [Action, {
          label: this.cancelLabel, noConfirm: true,
          onExecute: h(this, this.action, false)
        }]
      ];
    },

    action: function(confirm) {
      if (confirm) {
        this.promise.resolve();
      } else {
        this.promise.reject();
      }

      if (this.dialog) {
        this.dialog.value = confirm;
        this.dialog.execute();
      }
    },

    declaredClass: module.id + "::_ConfirmWidget"

  });

  var self = {

    confirm: function(options) {
      return self.open(self.create(options));
    },

    open: function(widget) {
      var node = construct.create("div", {});
      node.appendChild(widget.domNode);
      var dialog = new _Dialog({/* childWidget: widget */}, node);
      widget.dialog = dialog;

      return dialog.show();
    },

    create: function(options) {
      var w = new _ConfirmWidget(options);
      return w;
    },

    promise: function(widget) {
      return widget.promise;
    },

  };

  return self;

});
