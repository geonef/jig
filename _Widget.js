define([
  "module",
  "dojo/_base/declare",
  "dijit/_Widget",
  "dojo/_base/lang",
  "dojo/_base/fx",
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/aspect",
  "dojo/promise/all",
  "dojo/Deferred",

  "./util/makeDOM",
  "./util/async"
], function(module, declare, _Widget, lang, fx, style, domClass, aspect, allPromises, Deferred,
            makeDOM, async) {

  /**
   * Base class widget class
   *
   * Child classes should define 'makeContentNodes' as a function
   * returning an array of node definitions (first arg to geonef/jig/util/makeDOM)
   */
return declare([_Widget], { //--noindent--

  /**
   * CSS classes to be set on domNode
   *
   * @type {string} class
   */
  'class': 'jigWidget',

  /**
   * Other CSS classes to be added on domNode
   *
   * This proprty works the same as 'class', they are distinct for the
   * convenience of inheritance.
   *
   * @type {string} extraClass
   */
  extraClass: '',

  /**
   * Nom du noeud DOM domNode du widget
   *
   * @type {string} nodeName
   */
  nodeName: 'div',

  /**
   * Static alternative to implementing makeContentNodes()
   *
   * @type {Array.<Array>} contentNodes
   */
  contentNodes: [],

  /**
   * If true, content nodes are built upon rebuildDom(), not initial buildRendering()
   *
   * In this case, the concrete class has the responsability to build
   * rebuildDom() (typically, when some data used by makeContentNodes() were
   * sucessfully loaded).
   *
   * @type {boolean} delayedContent
   */
  delayedContent: false,

  /**
   * Promise, resolved when widget DOM content is built and ready
   *
   * @type {dojo/Deferred}
   */
  whenDomReady: null,

  /**
   * Names of node properties to hide when a sub-widget is open
   *
   * @type {Array.<string>} subHides
   */
  subHides: [],


  /**
   * @override
   */
  postMixInProperties: function() {
    this.domWidgets = [];
    this.whenDomReady = new Deferred();
    this.inherited(arguments);
  },

  /**
   * @override
   */
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

  /**
   * Copy children nodes from this.srcNodeRef to this.containerNode
   *
   * this.containerNode has to be defined
   */
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

  /**
   * @override
   */
  startup: function() {
    this.inherited(arguments);
    this.domWidgets.forEach(function(w) { if (!w._started) { w.startup(); }});
    if (!this.delayedContent) {
      this.whenDomReady.resolve();
    }
  },

  /**
   * @override
   */
  destroyRendering: function() {
    this.destroyDom();
    if (this._supportingWidgets) {
      this._supportingWidgets.forEach(function(w) { w.destroy(); });
      delete this._supportingWidgets;
    }
    this.inherited(arguments);
  },

  /**
   * @override
   */
  destroyDom: function() {
    this.destroySubWidget();
    if (this.domWidgets) {
      this.domWidgets/*.slice(0)*/.forEach(function(w) { w.destroy(); });
      this.domWidgets = [];
    }
    if (this.domNode) {
      this.domNode.innerHTML = '';
    }
  },

  /**
   * Rebuild the DOM
   *
   * this.domNode itself remain unchanged, only its descendants are destroyed
   *
   * @param arg Custom arg passed to makeContentNodes()
   */
  rebuildDom: function(arg) {
    if (this._destroyed) { return null; }
    this.destroyDom();
    var domNode = this.domNode;
    var _this = this;
    return allPromises(this.dom(this.makeContentNodes(arg)))
      .then(function(nodes) {
        if (_this._destroyed) {
          throw new Error("rebuildDom(): widget was destroyed in the middle :(");
        }

        nodes.forEach(function(node) { if (node) { domNode.appendChild(node); } });
        _this.afterRebuildDom();
        return nodes;
      });
  },

  /**
   * Hook
   */
  afterRebuildDom: function() {
    if (!(this.whenDomReady.fired >= 0)) {
      this.whenDomReady.resolve();
    }
    this.onResize();
  },

  /**
   * Hook
   */
  onResize: function() {
  },

  /**
   * Kind of helper to util/makeDOM, using this as obj
   */
  dom: function(struct) {
    return makeDOM(struct, this);
  },

  /**
   * Add a widget within this.domNode and manage it's lifecycle
   *
   * @type {dijit/_WidgetBase} widget
   * @type {Function} onDestroy
   * @return {dijit/_WidgetBase} the given widget
   */
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
    aspect.before(widget, 'uninitialize',// 'destroy',
                  function() {
                    _this.destroySubWidget();
                    if (onDestroy) {
                      lang.hitch(_this, onDestroy)();
                    }
                  });

    return widget;
  },

  /**
   * Destroy a subwidget added with enablSubWidget
   *
   * @return {boolean} Whether the widget was not already closed
   */
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
      if (this.domNode) {
        domClass.remove(this.domNode, 'hasSub');
      }
      return true;
    }

    return false;
  },

  declaredClass: module.id

});

});