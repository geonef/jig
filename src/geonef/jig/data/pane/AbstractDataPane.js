
dojo.provide('geonef.jig.data.pane.AbstractDataPane');

dojo.require('geonef.jig._Widget');
dojo.require('geonef.jig.util');

/**
 * Base class for all data panes
 *
 * A data pane is a widget whose role is to "manage" a model object.
 *
 * It is typically a display, which can embed some editing/action
 * functionnalities.
 *
 * For a pure editor (form), geonef.jig.data.editor.AbstractTemplated
 * would better fit (form/validation/saving management).
 *
 * This handles init/load/events around this.object.
 */
dojo.declare('geonef.jig.data.pane.AbstractDataPane', geonef.jig._Widget,
{
  /**
   * @override
   */
  'class': geonef.jig._Widget.prototype['class'] + ' jigDataPane',

  /**
   * The model object - mandatory, must be given at construction
   *
   * @type {geonef.jig.data.model.Abstract}
   */
  object: null,

  /**
   * Properties to fetch
   *
   * @type {Array.<string>} autoRequestProps
   */
  autoRequestProps: [],


  removeConfirm: "Vraiment supprimer cet objet ?",


  /**
   * @override
   */
  postMixInProperties: function() {
    this.inherited(arguments);
    this.whenDataReady = this.autoRequestProps.length > 0 ?
      this.object.requestProps(this.autoRequestProps) : geonef.jig.util.newResolvedDeferred();
  },

  /**
   * @override
   */
  buildRendering: function() {
    this.inherited(arguments);
    this.whenDataReady.then(geonef.jig.util.busy(this.domNode));
  },

  makeDropDownNode: function(title) {
    var node = this.dom(
      [dijit.form.DropDownButton, {
            _attach: 'optionsDD',
            'class': 'nolabel gear',
            dropDown: new dijit.TooltipDialog({'class': 'jigActionsTooltip jigDataPaneTooltip'}) }]);
    this.dom(
      ['div', { _insert: this.optionsDD.dropDown.containerNode },
       [['h2', {}, title || ""],
        ['div', {'class':'actions'}, this.makeOptions()]]]);

    return node;
  },

  makeOptions: function() {
    return [
      [geonef.jig.button.Action, {
         label: "Supprimer",
         iconClass: 'remove',
         onExecute: dojo.hitch(this, this.deleteObject)
       }],
    ];
  },

  /**
   * @override
   */
  postCreate: function() {
    this.inherited(arguments);
    this.subscribe(this.object.channel, this.onModelChannel);
  },

  /**
   *  @override
   */
  startup: function() {
    this.inherited(arguments);
    this.whenDataReady.then(dojo.hitch(this, this.onDataReady));
  },

  /**
   * Called after model data is ready (props are fetched)
   */
  onDataReady: function() {
    this.onModelChange();
    this.afterModelChange();
  },

  /**
   * Model channel subscriber (registered in 'postCreate')
   *
   * @param {geonef.jig.data.model.Abstract} object
   * @param {string} type
   */
  onModelChannel: function(object, type) {
    if (object !== this.object || this._destroyed) { return; }
    if (type === 'put') {
      this.onModelChange();
    }
    if (type === 'afterPut') {
      this.afterModelChange();
    }
    if (type === 'delete') {
      this.destroy();
    }
  },

  /**
   * Hook - when the model object has changed
   *
   * It should be used by child classed to make custom updates if needed.
   */
  onModelChange: function(saving) {
    // this.panelPath = ["Ressources", this.object.getSummary()];
    this.onPanelPathChange();
  },

  /**
   * Hook - called after changes have been saved
   */
  afterModelChange: function(saving) {
  },

  onPanelPathChange: function() {},

  /** hook */
  onClose: function() {
  },

  deleteObject: function() {
    if (!window.confirm(this.removeConfirm)) { return; }
    this.object.store.remove(this.object)
      .then(geonef.jig.util.busy(this.domNode));
  },

});
