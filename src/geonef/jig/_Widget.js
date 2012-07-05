define("geonef/jig/_Widget", ["dijit/_Widget", "dojo"], function(_Widget, dojo) {

/**
 * Base class widget class
 *
 * Child classes should define 'makeContentNodes' as a function
 * returning an array of node definitions (first arg to geonef.jig.makeDOM)
 */
dojo.declare('geonef.jig._Widget', dijit._Widget,
{
  /**
   * CSS classes to be set on domNode
   *
   * @type {string} class
   */
  'class': 'jigWidget',

  nodeName: 'div',

  contentNodes: [],

  /**
   * If true, content nodes are built upon rebuildDom(), not initial buildRendering()
   *
   * @type {boolean} delayedContent
   */
  delayedContent: false,


  postMixInProperties: function() {
    this.domWidgets = [];
    this.inherited(arguments);
  },

   buildRendering: function() {
     if (!this.domNode) {
       var nodes = this.delayedContent ? [] : this.makeContentNodes();
       this.domNode = this.dom(
         [this.nodeName, { 'class': this['class'] }, nodes]);
     }
     this.inherited(arguments);


     var source = this.srcNodeRef;
     var dest = this.containerNode;

     if (source && dest){
       while (source.hasChildNodes()){
	 dest.appendChild(source.firstChild);
       }
     }
     // console.log('this.domNode', this.domNode, this);
  },

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
    if (this.domWidgets) {
      this.domWidgets.forEach(function(w) { w.destroy(); });
      this.domWidgets = [];
    }
    this.domNode.innerHTML = '';
  },

  rebuildDom: function() {
    this.destroyDom();
    return this.dom(this.makeContentNodes()).map(
      function(node) { this.domNode.appendChild(node); return node; }, this);
  },

  dom: function(struct) {
    return geonef.jig.makeDOM(struct, this);
  }

});

return geonef.jig._Widget;
});