define([
  "module",
  "dojo/_base/declare",
  "../../_Widget",
  "dojo/_base/lang",
  "dojo/_base/event",
  "dojo/dom-class",
  "../../util/async",
  "../../util/string"
], function(module, declare, _Widget, lang, event, domClass, async, string) {

return declare(_Widget, { //--noindent--

  enableClickEvent: true,

  /**
   * Represented model object
   *
   * @type {geonef/jig/data/model/Abstract}
   */
  object: null,

  autoRequestProps: [],

  'class': _Widget.prototype['class'] + ' jigDataRow',


  postMixInProperties: function() {
    this.inherited(arguments);
    this.whenDataReady = this.autoRequestProps.length > 0 ?
      this.object.requestProps(this.autoRequestProps) : async.bindArg();
  },

  buildRendering: function() {
    this.inherited(arguments);
    this.whenDataReady.then(async.busy(this.domNode));
  },

  buildRow: function() {
    if (this.object) {
      this.domNode.innerHTML = string.escapeHtml(this.object.getSummary());
      if (this.enableClickEvent) {
        domClass.add(this.domNode, 'link');
      }
    }
  },

  postCreate: function() {
    this.inherited(arguments);
    if (this.enableClickEvent) {
      this.connect(this, 'onClick', this.onItemClick);
    }
  },

  startup: function() {
    this.inherited(arguments);
    this.whenDataReady.then(lang.hitch(this, this.onDataReady));
  },

  onDataReady: function() {
    this.buildRow();
  },

  onItemClick: function(evt) {
    if (evt) {
      event.stop(evt);
    }
    this.onExecute();
  },

  onExecute: function() {
    if (this.object.openPane) {
      this.object.openPane();
    }
  },

  declaredClass: module.id

});

});
