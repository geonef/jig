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
  "dojo/io-query",
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/string",
  "dojo/topic",
  "dojo/window",
  "dojo/promise/all",

  "dojo/Deferred",
  "../model",
  "./BasicRow",

  "../../util/async",
  "../../util/number",
  "../../button/Action",

  "dojo/i18n!../../nls/listBasic",
  // "css!./Basic",
  // "css!./Basic"

], function(module, declare, _Widget, CreatorMixin,
            lang, ioQuery, style, domClass, string, topic, win, allPromises,
            Deferred, model, BasicRow,
            async, number, Action, _) {

  var h = lang.hitch;

return declare([ _Widget, CreatorMixin ], { //--noindent--

  /**
   * Refresh list on widget creation
   *
   * @type {boolean}
   */
  initialRefresh: true,

  /**
   * Refresh list on "put" changes
   *
   * @type {boolean}
   */
  refreshOnChange: true,

  /**
   * Current page
   *
   * @type {integer} positive
   */
  currentPage: 1,

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
   * Name of propGroup to request for fetching objectProperty
   *
   * @type {string}
   */
  objectPropertyGroup: null,

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

  queryOptions: {},

  refreshChannelTypes: ['put', 'delete'],

  /**
   * Dic for count title
   *
   * For example: ["No objet", "One object", "${count} objects"]
   *
   * @type {Array.<string>}
   */
  countTitleDic: null,

  /**
   * Node name of result node, used in makeContentNodes()
   *
   * @type {string}
   */
  resultNodeName: "div",

  /**
   * @type {string}
   */
  msgMore: "+ ${count} objets",

  /**
   * @type {string}
   */
  emptyLabel: "", //"aucun résultat",

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
   * @type {dojo/Deferred}
   */
  whenListReady: null,

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
    this.filter = lang.mixin({}, this.filter);
    this.rowOptions = lang.mixin({}, this.rowOptions);
    this.whenReady = async.bindArg();
    this.whenListReady = new Deferred();
    this.store = model.getAppStore(this.appView, this.Model);
  },

  getUrlCountPart: function() {
    var res = this.results;

    return res && res.currentPage > 1 ? ("/" + res.currentPage) : "";
  },

  /**
   * @override
   */
  buildRendering: function() {
    this.inherited(arguments);
    domClass.add(this.domNode, "loading " + (this.readOnly ? 'ro' : 'rw'));
  },

  getPagingLabel: function(currentPageOnly) {
    var res = this.results;
    return currentPageOnly ?
      (res && res.currentPage > 1 ? " ("+res.currentPage+")" : "")
    : (res && res.pageCount > 1 ? " ("+res.currentPage+"/"+res.pageCount+")" : "");
  },

  makeContentNodes: function() {
    return [
      this.makeSpinnerNode("listLoading"),
      ["div", {_attach: "emptyNode", "class":"panelControl emptyLabel", _style:{display:"none"}}, this.emptyLabel],
      [this.resultNodeName, {_attach: 'listNode', 'class': 'jigDataListResults results' }], // TODO: remove "results"
      ["div", {_attach: "pageControlNode", "class":"pageControl stopf", "style": "display:none"}, [
        [Action, {
          _attach: "nextAction", noSubmit: true,
          label: _.paging.next, extraClass: "primary floatr",
          onExecute: h(this, function() {
            this.refresh({ currentPage: this.currentPage + 1});
          })
        }],
        [Action, {
          _attach: "previousAction", noSubmit: true,
          label: _.paging.previous, extraClass: "primary floatl",
          onExecute: h(this, function() {
            this.refresh({ currentPage: this.currentPage - 1});
          })
        }],
        ["span", {"class":"label"}, [
          ["span", {_attach: "currentPageNode"}],
          ["span", {}, "/"],
          ["span", {_attach: "pageCountNode"}],
        ]]
      ]],
    ];
  },

  /**
   * @override
   */
  postCreate: function() {
    this.inherited(arguments);
    if (this.emptyNode) {
      style.set(this.emptyNode, 'display', 'none');
    }
    if (this.initialRefresh) {
      this.refresh();
    }
    if (this.refreshOnChange) {
      this.subscribe(this.store.channel, this.onChannel);
    }
    if (this.object) {
      this.subscribe(this.object.store.channel, this.onObjectChannel);
    }
  },

  /**
   * @override
   */
  startup: function() {
    if (this._started) { return null; }
    this.inherited(arguments);
    return this.whenReady.then(h(this, this.rebuildDom));
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
  refresh: function(options, fetchOptions) {
    if (this.refreshing) {
      return async.bindArg(null);
    }
    // console.log("list refresh", this.id, options, this.domNode);
    var _this = this;
    this.refreshing = true;
    // var scrollTop = this.domNode.scrollTop;
    // this.clear();
    domClass.add(this.domNode, "loading");
    if (this.pageControlNode) {
      style.set(this.pageControlNode, "display", "none");
    }
    lang.mixin(this, options);
    var promise = this.fetchResults(fetchOptions)
      .then(
        function(results) {
          topic.publish("data/list/fetched", _this, results);
          return results;
        },
        function(error) {
          console.log("data query error", error);
          // if (error != "geonef-data-query-notMatched") {
          throw error;
          // }
        }
      )
      .then(async.deferWhen(this.whenDomReady))
      .then(
        function(results) {
          if (!_this._destroyed) {
            _this.clear();
            _this.populateList(results);
            _this.afterRefresh();
          }
        },
        function() {
          // console.log("in error", this, arguments);
          _this.afterRefresh();
        })
    ;
    if (this.whenDomReady.fired >= 0) {
      promise.then(async.busy(this.domNode));
    }
    return promise;
  },

  afterRefresh: function() {
    if (this._destroyed) { return; }
    domClass.remove(this.domNode, "loading");
    // this.domNode.scrollTop = scrollTop;
    this.refreshing = false;
    this.onResize();
  },

  /**
   * Make a query or fetch 'many' prop, depending on this.objectProperty
   *
   * @return {dojo/Deferred}
   */
  fetchResults: function(options) {
    var query = this.buildQuery();
    var _this = this;

    if (this.objectProperty) {
      var promise = this.objectPropertyGroup
        ? this.object.requestProps(this.objectPropertyGroup)
        : this.object.get(this.objectProperty);

      return promise.then(function() {
        var arrayValue = _this.object[_this.objectProperty];
        if (arrayValue instanceof Array) {
          // console.log("filtering", _this.id, query, "before", arrayValue.length,
          //             "after", arrayValue.filter(model.queryToFilterFunc(query)).length,
          //            arrayValue);
          arrayValue = arrayValue.filter(model.queryToFilterFunc(query));
          if (_this.sorting) {
            var sortName = _this.sorting.name;
            var sortDir = _this.sorting.desc ? -1 : 1;
            arrayValue.sort(function(a, b) {
              return sortDir * (a && a[sortName] && a[sortName].localeCompare(b && b[sortName]));
            });
          }
        } else {
          console.warn(module.id, "object property is not an array:",
                       arrayValue, "objectproperty=", _this.objectProperty,
                       "object=", _this.object);
        }
        return arrayValue;
      });
    } else {
      options = lang.mixin({}, this.queryOptions, options);
      if (this.sorting) {
        options.sort = this.sorting;
      }
      var props = {
        sorting: "sort",
        fieldGroup: "fieldGroup",
        limit: "pageLength",
        currentPage: "page",
      };
      for (var prop in props) if (props.hasOwnProperty(prop)) {
        if (this[prop] !== undefined) {
          options[props[prop]] = this[prop];
        }
      }

      return this.store.query(query, options);
    }
  },

  /**
   * @return {Object}
   */
  buildQuery: function() {
    return lang.mixin({}, this.filter);
  },

  /**
   * Build a query-string formatting of this.buildQuery() and sorting
   */
  makeQueryString: function(options) {
    var query = this.buildQuery(options);
    Object.keys(query).forEach(function(key) {
      if (query[key].id) {
        query[key] = query[key].id;
      }
    });
    var qs = ioQuery.objectToQuery(query);
    // console.log("qs", qs, query);
    return qs;
  },


  /**
   * @param {Array.<geonef/jig/data/model/Abstract>} results
   */
  populateList: function(results) {
    this.results = results;
    this.updateCountStats(results);
    this.rows = results.map(this.makeRow, this);
    this.rows.forEach(this.placeRow, this);
    this.modelId2row = {};
    this.rows.forEach(function(row) {
      this.modelId2row[row.object.id] = row;
    }, this);
    var _this = this;
    allPromises(this.rows
                .filter(function(row) { return !!row.whenDataReady; })
                .map(function(row) { return row.whenDataReady; }))
      .then(function() {
        if (_this._destroyed) { return; }
        _this.afterPopulateList();
        _this.whenListReady.resolve();
      });
  },

  updateCountStats: function(results) {
    if (this.emptyNode) {
      style.set(this.emptyNode, 'display', results.length > 0 ? 'none' : '');
    }
    if (this.countNode) {
      this.countNode.innerHTML = number.pluralString(results.resultCount, this.countTitleDic);
    }
    (results.length > 0 ? domClass.remove : domClass.add)(this.domNode, 'empty');
    if (this.currentPageNode) {
      this.currentPageNode.innerHTML = results.currentPage;
    }
    if (this.pageCountNode) {
      this.pageCountNode.innerHTML = results.pageCount;
    }
    if (this.previousAction) {
      style.set(this.previousAction.domNode, "visibility", this.currentPage > 1 ? "" : "hidden");
      style.set(this.nextAction.domNode, "visibility", this.currentPage < results.pageCount ? "" : "hidden");
    }
    if (this.pageControlNode) {
      style.set(this.pageControlNode, "display", results.pageCount > 1 ? "" : "none");
    }
    if (this.onTitleChange) {
      this.onTitleChange();
      this.onUrlChange();
    }
  },


  /**
   * Hook
   */
  afterPopulateList: function() {
  },

  makeRow: function(obj, key) {
    return new (this.RowClass)(
      lang.mixin({ object: obj, listWidget: this }, this.domWidgetProps, this.rowOptions));
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
    delete this.results;
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

    // if (this.refreshChannelTypes.indexOf(type) !== -1) {
    //   console.log("filter", type, this.filter, obj);
    // }
    if (this._destroyed) { return; }
    // console.log("list channel", arguments, this.refreshChannelTypes, this);
    if (this.refreshChannelTypes.indexOf(type) !== -1
        /* && this.store.matchFilter(obj, this.filter || {})*/) {


      var inPage = this.results &&
        this.results.some(function(object) { return object === obj; });
      // console.log("inPage", inPage, obj, this.results);

      this.refresh({}, { ifMatch: inPage ? null : obj.id });
    } else if (this.modelId2row) {
      var row = this.modelId2row[obj.id];
      // console.log("onChannel", this, row, arguments);
      if (row && row.onModelChannel) {
        if (row.onModelChannel.apply(row, arguments)) {
          win.scrollIntoView(row.domNode);
        }
      }
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
