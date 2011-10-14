
define("geonef/jig/data/list/Basic", ["dijit/_Widget", "dijit/_Templated", "geonef/jig/api", "geonef/jig/Deferred", "geonef/jig/data/model", "geonef/jig/data/list/BasicRow", "dojo", "geonef/jig/util", "geonef/jig/button/Action", "geonef/jig/button/Link"], function(_Widget, _Templated, api, Deferred, model, BasicRow, d) {


d.declare('geonef.jig.data.list.Basic', [ _Widget, _Templated ],
{

  panelPath: "Mes couches",

  /**
   * @type {geonef.jig.data.model.Abstract}
   */
  Model: null,

  /**
   * @type {dijit._Widget} Widget class to use for rows
   */
  RowClass: BasicRow,

  /**
   * @type {geonef.jig.Deferred}
   */
  whenReady: null,

  postMixInProperties: function() {
    this.inherited(arguments);
    this.whenReady = new Deferred();
  },

  buildRendering: function() {
    this.inherited(arguments);
    dojo.addClass(this.domNode, 'jigDataListBasic');
  },

  postCreate: function() {
    this.inherited(arguments);
    this.store = model.getStore(this.Model);
    this.refresh();
  },

  startup: function() {
    this.inherited(arguments);
    this.whenReady.callback();
  },

  refresh: function() {
    console.log('refresh', this, arguments);
    this.store.query({})
        .then(dojo.hitch(this, this.populateList))
        .then(geonef.jig.util.busy(this.domNode));
  },

  populateList: function(results) {
    this.clear();
    this.rows = results.map(
        function(obj) {
          var row = new (this.RowClass)({ object: obj });
          row.placeAt(this.listNode).startup();
          return row;
        }, this);
  },

  clear: function() {
    if (this.rows) {
      this.rows.forEach(function(row) { row.destroy(); });
    }
    delete this.rows;
  },

  createNew: function(props, options) {
    var self = this;
    return this.createNewObject(props)
        .then(function(obj) {
                if (!obj) { return false; }
                return self.store.add(obj, options)
                    .then(dojo.hitch(self, self.afterCreateNew));
              })
        .then(geonef.jig.util.busy(this.domNode));
  },

  /**
   * @return {geonef.jig.Deferred}
   */
  createNewObject: function(props) {
    var deferred = new geonef.jig.Deferred();
    var object = new (this.Model)(props);
    deferred.resolve(object); // unset object by default
    return deferred;
  },

  /** hook */
  afterCreateNew: function(object) {},



});

return geonef.jig.data.list.Basic;
});
