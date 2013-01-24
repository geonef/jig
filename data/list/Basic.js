/**
 * Basic list, made from distinct row widgets
 *
 * To be declared by concrete class at runtime:
 *
 *   - listNode : node where placeRow() will insert row widgets
 *   - emptyNode : if defined, will be visible/hidden depending on empty results or not
 *
 */
define([
  "module",
  "dojo/_base/declare",
  "../../_Widget",
  "../pane/CreatorMixin",

  "dojo/_base/lang",
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/string",
  "dojo/promise/all",

  "dojo/Deferred", // was using geonef/jig/Deferred
  "../model",
  "./BasicRow",

  "../../util/async",
  "../../button/Action",
], function(module, declare, _Widget, CreatorMixin,
            lang, style, domClass, string, allPromises,
            Deferred, model, BasicRow,
            async, Action) {

return declare([ _Widget, CreatorMixin ], { //--noindent--

  /**
   * Object to get the data from (see 'objectProp'), or null for independant query
   *
   * @type {!geonef/jig/data/model/Abstract}
   */
  object: null,

  /**
   * Name of object property to get the data from, or null for independant query
   *
   * @type {string}
   */
  objectProperty: null,

  /**
   * Whether list is read-only
   *
   * @type {boolean}
   */
  readOnly: false,

  /**
   * @type {Object}
   */
  filter: {},

  /**
   * @type {!string}
   */
  fieldGroup: null,

  /**
   * Sorting order, like { name: 'propertyName', desc: false }
   *
   * @type {Object}
   */
  sorting: null,

  /**
   * Max number of shown results
   *
   * @type {integer}
   */
  limit: null,

  /**
   * @type {string}
   */
  msgMore: "+ ${count} objets",

  /**
   * @type {geonef/jig/data/model/Abstract}
   */
  Model: null,

  /**
   * Widget class to use for rows
   * @type {dijit/_Widget}
   */
  RowClass: BasicRow,

  /**
   * Options given to row widgets
   * @type {Object}
   */
  rowOptions: {},

  /**
   * @type {dojo/Deferred}
   */
  whenReady: null,

  /**
   * @override
   */
  'class': _Widget.prototype['class'] + ' jigDataList',

  /**
   * @override
   */
  delayedContent: true,

  /**
   * @override
   */
  postMixInProperties: function() {
    this.inherited(arguments);
    this.rowOptions = lang.mixin({}, this.rowOptions);
    this.whenReady = async.bindArg();
    this.store = model.getStore(this.Model);
  },

  /**
   * @override
   */
  buildRendering: function() {
    this.inherited(arguments);
    domClass.add(this.domNode, this.readOnly ? 'ro' : 'rw');
  },

  /**
   * @override
   */
  postCreate: function() {
    this.inherited(arguments);
    this.refresh();
    this.subscribe(this.store.channel, this.onChannel);
    if (this.object) {
      this.subscribe(this.object.store.channel, this.onObjectChannel);
    }
  },

  /**
   * @override
   */
  startup: function() {
    if (this._started) { return; }
    this.inherited(arguments);
    this.whenReady.then(lang.hitch(this, this.rebuildDom));
  },

  /**
   * @override
   */
  destroy: function() {
    this.clear();
    this.inherited(arguments);
  },

  /**
   * Refresh the list
   */
  refresh: function() {
    this.fetchResults()
      .then(async.deferWhen(this.whenDomReady))
      .then(lang.hitch(this, this.populateList))
      .then(async.busy(this.domNode));
  },

  /**
   * Make a query or fetch 'many' prop, depending on this.objectProperty
   *
   * @return {dojo/Deferred}
   */
  fetchResults: function() {
    if (this.objectProperty) {
      return this.object.get(this.objectProperty);
    } else {
      var options = {};
      if (this.sorting) {
        options.sort = this.sorting;
      }
      if (this.fieldGroup) {
        options.fieldGroup = this.fieldGroup;
      }
      return this.store.query(this.buildQuery(), options);
    }
  },

  /**
   * @return {Object}
   */
  buildQuery: function() {
    return lang.mixin({}, this.filter);
  },

  /**
   * @param {Array.<geonef/jig/data/model/Abstract>} results
   */
  populateList: function(results) {
    if (this._destroyed) { return; }
    var scrollTop = this.domNode.scrollTop;
    this.clear();
    if (this.emptyNode) {
      style.set(this.emptyNode, 'display', results.length > 0 ? 'none' : '');
    }
    if (this.countLink) {
      this.countLink.set('label', '('+(results.totalCount || results.length)+')');
    }
    (results.length > 0 ? domClass.remove : domClass.add)(this.domNode, 'empty');
    var over = this.limit && this.limit < results.length &&
      results.length - this.limit;
    if (over) {
      results = results.slice(0, this.limit);
    }
    this.rows = results.map(this.makeRow, this)
      .map(this.placeRow, this);
    if (over) {
      var moreLink = new Action(
        { label: string.substitute(this.msgMore, { count: over }),
          title: "Cliquer pour afficher",
          onExecute: lang.hitch(this, this.openList) });
      domClass.add(moreLink.domNode, 'jigDataRow more');
      this.placeRow(moreLink, null);
      this.rows.push(moreLink);
    }
    var _this = this;
    allPromises(this.rows
                .filter(function(row) { return !!row.whenDataReady; })
                .map(function(row) { return row.whenDataReady; }))
      .then(function() {
        if (_this._destroyed) { return; }
        _this.domNode.scrollTop = scrollTop;
        _this.afterPopulateList(scrollTop);
      });
  },

  /**
   * Hook
   */
  afterPopulateList: function() {
  },

  makeRow: function(obj, key) {
    var row = new (this.RowClass)(
      lang.mixin({ object: obj, listWidget: this },
                 this.rowOptions));
    return row;
  },

  /**
   * @type {dijit/_Widget} row widget to place
   */
  placeRow: function(row, key) {
    row.placeAt(this.listNode);
    row.startup();
    return row;
  },

  /**
   * Clear the list
   */
  clear: function() {
    if (this.rows) {
      this.rows.forEach(
        function(row) { if (!row._destroyed) { row.destroy(); } });
    }
    delete this.rows;
  },

  openList: function() {
    console.warn("to overload: openList()", this);
  },

  /**
   * Model channel subscribe handler
   *
   * @param {geonef/jig/data/model/Abstract} obj model object
   * @param {string} type                        type of event
   */
  onChannel: function(obj, type) {
    if (['put', 'delete'].indexOf(type) !== -1) {
      this.refresh();
    }
  },

  /**
   * Channel subscribe handler for this.object
   *
   * @param {geonef/jig/data/model/Abstract} obj model object
   * @param {string} type                        type of event
   */
  onObjectChannel: function(obj, type) {
  },

  declaredClass: module.id

});

});
