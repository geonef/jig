
dojo.provide('geonef.jig.data.pane.AbstractDataPane');

// parents
dojo.require('dijit._Widget');
dojo.require('geonef.jig.util');

// used in code
dojo.require('geonef.ploomap.input.ExtentView');
dojo.require('geonef.jig.data.editor.Property');

/**
 * Base class for all data panes
 *
 * This handles init/load/events around this.object.
 */
dojo.declare('geonef.jig.data.pane.AbstractDataPane', dijit._Widget,
{
  /**
   * @type {geonef.jig.data.model.Abstract}
   */
  object: null,

  autoRequestProps: [],


  postMixInProperties: function() {
    this.inherited(arguments);
    this.whenDataReady = this.autoRequestProps.length > 0 ?
      this.object.requestProps(this.autoRequestProps) : geonef.jig.util.newResolvedDeferred();
  },

  buildRendering: function() {
    this.inherited(arguments);
    this.whenDataReady.then(geonef.jig.util.busy(this.domNode));
  },

  postCreate: function() {
    this.inherited(arguments);
    this.subscribe(this.object.channel, this.onModelChannel);
  },

  startup: function() {
    this.inherited(arguments);
    this.whenDataReady.then(dojo.hitch(this, this.onDataReady));
  },

  onDataReady: function() {
    this.onModelChange();
  },

  onModelChannel: function(object, type) {
    if (object !== this.object) { return; }
    if (type === 'put') {
      this.onModelChange();
    }
    if (type === 'delete') {
      this.close();
    }
  },

  /** hook */
  onModelChange: function() {},

  /** hook */
  onClose: function() {},

});
