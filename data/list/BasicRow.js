define([
  "module",
  "dojo/_base/declare",
  "../../_Widget",

  "dojo/_base/lang",
  "dojo/_base/event",
  "dojo/dom-class",
  "dojo/on",
  "../../util/async",
  "../../util/string"
], function(module, declare, _Widget,
            lang, event, domClass, on, async, string) {

return declare(_Widget, { //--noindent--

  enableClickEvent: true,

  /**
   * Represented model object
   *
   * @type {geonef/jig/data/model/Abstract}
   */
  object: null,

  autoRequestProps: [],

  /**
   * Options for appView.modelPane()
   */
  paneOptions: {},

  /**
   * @override
   */
  'class': _Widget.prototype['class'] + ' jigDataRow',

  /**
   * @override
   */
  delayedContent: true,

  /**
   * @override
   */
  postMixInProperties: function() {
    this.inherited(arguments);
    this.whenDataReady = this.autoRequestProps.length > 0 ?
      this.object.requestProps(this.autoRequestProps) : async.bindArg();
    if (this.object.id) {
      this["class"] = this["class"] + " ref-" + this.object.getRef();
    }
  },

  /**
   * @override
   */
  buildRendering: function() {
    this.inherited(arguments);
    this.whenDataReady.then(async.busy(this.domNode));
  },

  /**
   * @override
   */
  makeContentNodes: function() {
    var nodes = [];
    if (this.object) {
      nodes.push(["span", {}, string.escapeHtml(this.object.getSummary())]);
      if (this.enableClickEvent) {
        domClass.add(this.domNode, 'link');
      }
    }
    return nodes;
  },

  /**
   * @override
   */
  postCreate: function() {
    this.inherited(arguments);
    if (this.enableClickEvent) {
      this.own(on(this, "click", lang.hitch(this, this.onItemClick)));
    }
  },

  /**
   * @override
   */
  startup: function() {
    this.inherited(arguments);
    this.whenDataReady.then(lang.hitch(this, this.onDataReady));
  },

  /**
   * Callback executed when widget is started AND 'whenDataReady' is resolved
   */
  onDataReady: function() {
    this.rebuildDom();
  },

  /**
   * Callback executed when the row is clicked (disabled by: {enableClickEvent:false} )
   */
  onItemClick: function(evt) {
    if (evt) {
      event.stop(evt);
    }
    this.onExecute();
  },

  /**
   * Called by onItemClick()
   */
  onExecute: function() {
    var pane = this.appView.modelPane(this.object, this.paneOptions);
    if (pane) {
      pane.open();
    }
  },

  declaredClass: module.id

});

});
