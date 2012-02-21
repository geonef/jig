define("geonef/jig/_Widget", ["dijit/_Widget", "dojo"], function(_Widget, dojo) {

dojo.declare('geonef.jig._Widget', dijit._Widget,
{
  'class': 'jigWidget',

  postMixInProperties: function() {
    this.domWidgets = [];
  },

  buildRendering: function() {
    this.domNode = this.dom(
      ['div', { 'class': this['class'] }, this.makeContentNodes()]);
    // console.log('this.domNode', this.domNode, this);
  },

  startup: function() {
    this.inherited(arguments);
    this.domWidgets.forEach(function(w) { w.startup(); });
  },

  destroyRendering: function() {
    if (this.domWidgets) {
      this.domWidgets.forEach(function(w) { w.destroy(); });
      delete this.domWidgets;
    }
    this.inherited(arguments);
  },


  dom: function(struct) {
    return geonef.jig.makeDOM(struct, this);
  }

});

return geonef.jig._Widget;
});