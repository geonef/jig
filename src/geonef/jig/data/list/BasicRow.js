define("geonef/jig/data/list/BasicRow", ["geonef/jig/_Widget", "dojo", "geonef/jig/util/string"], function(_Widget, dojo, stringUtils) {

dojo.declare('geonef.jig.data.list.BasicRow', geonef.jig._Widget,
{

  enableClickEvent: true,

  /**
   * @type {geonef.jig.data.model.Abstract} represented model object
   */
  object: null,

  autoRequestProps: [],

  'class': 'jigDataRow',


  postMixInProperties: function() {
    this.inherited(arguments);
    this.whenDataReady = this.autoRequestProps.length > 0 ?
      this.object.requestProps(this.autoRequestProps) : geonef.jig.util.newResolvedDeferred();
  },

  buildRendering: function() {
    this.inherited(arguments);
    this.whenDataReady.then(geonef.jig.util.busy(this.domNode));
  },

  buildRow: function() {
    if (this.object) {
      this.domNode.innerHTML = geonef.jig.util.string.escapeHtml(this.object.getSummary());
      if (this.enableClickEvent) {
        dojo.addClass(this.domNode, 'link');
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
    this.whenDataReady.then(dojo.hitch(this, this.onDataReady));
  },

  onDataReady: function() {
    this.buildRow();
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
