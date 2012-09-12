define([
         "dojo/_base/declare",
         "dijit/_Widget",
         "dojo/_base/lang",
         "dojo/dom-style",
         "dojo/dom-class",
         "dojo",
         "./util/makeDOM",
         "./util/promise",
], function(declare, _Widget, lang, style, domClass, dojo, makeDOM, promise) {

/**
 * Base class widget class
 *
 * Child classes should define 'makeContentNodes' as a function
 * returning an array of node definitions (first arg to geonef/jig/util/makeDOM)
 */
return declare('geonef.jig._Widget', _Widget,
{
  /**
   * CSS classes to be set on domNode
   *
   * @type {string} class
   */
  'class': 'jigWidget',

  extraClass: '',

  nodeName: 'div',

  contentNodes: [],

  /**
   * If true, content nodes are built upon rebuildDom(), not initial buildRendering()
   *
   * @type {boolean} delayedContent
   */
  delayedContent: false,

  /**
   * Names of node properties to hide when a sub-widget is open
   *
   * @type {Array.<string>} subHides
   */
  subHides: [],


  postMixInProperties: function() {
    this.domWidgets = [];
    this.inherited(arguments);
  },

  buildRendering: function() {
    if (!this.domNode) {
      var attrs = { 'class': this['class']+' '+this.extraClass };
      if (this.srcNodeRef && this.srcNodeRef.hasAttribute('style')) {
        attrs.style = this.srcNodeRef.getAttribute('style');
      }
      var nodes = this.delayedContent ? [] : this.makeContentNodes();
      this.domNode = this.dom([this.nodeName, attrs, nodes]);
    }
    this.inherited(arguments);
  },

  copySrcNodeChildren: function() {
    var source = this.srcNodeRef;
    var dest = this.containerNode;

    if (source && dest){
      while (source.hasChildNodes()){
        dest.appendChild(source.firstChild);
      }
    }
  },


  /**
   * Overriden by child class to define DOM content
   *
   * @return {Array}    An array of arrays (see geonef/jig/util/makeDOM).
   *                    It can contain DOM Elements or flat makeDOM representation.
   *                    If it has promises, then this.delayedContent must be true
   *                    (buildRendering() does not support asynchronous DOM).
   */
  makeContentNodes: function() {
    return this.contentNodes;
  },

  startup: function() {
    this.inherited(arguments);
    this.domWidgets.forEach(function(w) { w.startup(); });
  },

  destroyRendering: function() {
    this.destroyDom();
    if (this._supportingWidgets) {
      this._supportingWidgets.forEach(function(w) { w.destroy(); });
      delete this._supportingWidgets;
    }
    this.inherited(arguments);
  },

  destroyDom: function() {
    this.destroySubWidget();
    if (this.domWidgets) {
      this.domWidgets.forEach(function(w) { w.destroy(); });
      this.domWidgets = [];
    }
    if (this.domNode) {
      this.domNode.innerHTML = '';
    }
  },

  /**
   * @param arg Custom arg passed to makeContentNodes()
   */
  rebuildDom: function(arg) {
    if (this._destroyed) { return null; }
    this.destroyDom();
    var domNode = this.domNode;
    var _this = this;
    return promise.whenAll(
      this.dom(this.makeContentNodes(arg))).then(
      function(nodes) {
        // console.log('rebuildDom : got nodes', nodes);
        nodes.forEach(function(node) { domNode.appendChild(node); });
        _this.afterRebuildDom();
        return nodes;
      });
  },

  /**
   * Hook
   */
  afterRebuildDom: function() {
  },

  dom: function(struct) {
    return makeDOM(struct, this);
  },

  enableSubWidget: function(widget, onDestroy) {
    this.destroySubWidget();
    this.subHides.forEach(
        function(name) {
          var node = this[name];
          if (node) {
            style.set(node.domNode || node, 'display', 'none');
          }
        }, this);
    widget.placeAt(this.opNode).startup();
    this.subWidget = widget;
    domClass.add(this.domNode, 'hasSub');
    var _this = this;
    widget.connect(widget, 'uninitialize',
      function() {
        _this.destroySubWidget();
        if (onDestroy) {
          lang.hitch(_this, onDestroy)();
        }
      });

    return widget;
  },

  destroySubWidget: function() {
    var widget = this.subWidget;
    if (widget) {
      delete this.subWidget;
      if (!widget._beingDestroyed) {
        widget.destroy();
      }
      this.subHides.forEach(
          function(name) {
          var node = this[name];
            if (node) {
              style.set(node.domNode || node, 'display', '');
            }
          }, this);
      domClass.remove(this.domNode, 'hasSub');
      return true;
    }

    return false;
  }

});

});