
define("geonef/jig/data/list/BasicRow", ["dijit/_Widget", "dijit/_Templated", "dojo"], function(_Widget, _Templated, d) {

d.declare('geonef.jig.data.list.BasicRow', [ _Widget, _Templated ],
{

  object: null,

  templateString: '<div class="jigDataRow"></div>',


  buildRendering: function() {
    this.inherited(arguments);
    if (this.object) {
      this.domNode.innerHTML = this.object.getSummary();
      dojo.addClass(this.domNode, 'link');
    }
  },

  postCreate: function() {
    this.inherited(arguments);
    this.connect(this, 'onClick', this.onItemClick);
  },

  onItemClick: function(event) {
    if (event) {
      dojo.stopEvent(event);
    }
    this.onExecute();
  },

  onExecute: function() {

  }

});

return geonef.jig.data.list.BasicRow;
});
