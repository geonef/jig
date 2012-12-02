/**
 * Mixin class providing group-input functionality
 *
 * This class helps manage multiple input (form) widgets as a group,
 * somewhat like dijit/form/Form does.
 *
 * This class is just a mixin. If you need a real widget, use the input/Group
 * class instead.
 */
define([
  "dojo/_base/declare",
  "dijit/form/_FormMixin",
  "dojo/_base/lang",
  "dojo/aspect",
  "../util/widget",
], function(declare, _FormMixin, lang, aspect, widget) {

return declare(_FormMixin, { //--noindent--

  /**
   * Name of this item: required if we are a child of another _Container
   */
  name: '',

  /**
   * If true, will return an array (in doc order) rather than a name/value object
   *
   * @type {boolean}
   */
  arrayContainer: false,

  /**
   * If true, returned value is the array of sub-widgets' names whose value is true
   * Implies that arrayContainer==true
   *
   * @type {boolean}
   */
  booleanUnion: false,

  /**
   * All keps specified there are managed by this.attr instead of sub-widgets
   *
   * @type {Array.<string>}
   */
  manageValueKeys: [],

  additionalRoots: [],

  /**
   * 'read-only' property, forwarded to child inputs
   */
  readOnly: null,

  /**
   * @override
   */
  postMixInProperties: function() {
    this.internalValues = {};
    this.manageValueKeys = lang.clone(this.manageValueKeys);
    this.inherited(arguments);
  },

  /**
   * @override
   */
  buildRendering: function() {
    this.inherited(arguments);
    if (!this.containerNode) {
      this.containerNode = this.domNode; // needed by parent _FormMixin
    }
  },

  /**
   * Find first descendants widgets having a "name" property
   *
   * When a widget is met, if it has a "name" property, the search does not go deeper.
   * If it does not, its sub-widgets are scanned recursively.
   *
   * @return {Array.<dijit/_WidgetBase>}
   */
  getDescendants: function() {
    var list = [];
    this.getInputRootNodes().map(widget.getFirstNamedDescendants)
      .forEach(function(set) { set.forEach(function(n) { list.push(n); }); });
    return list;
  },

  _getDescendantFormWidgets: function() {
    return this.getDescendants();
  },


  /**
   * Make the list of DOMNodes to search child inputs into - protected
   *
   * @return {Array.<HTMLElement>}
   */
  getInputRootNodes: function() {
    return [ this.domNode ].concat(this.additionalRoots);
  },

  /**
   * @override
   */
  connectChildren: function(){
    // console.log('connectChildren', this, arguments);
    this.inherited(arguments);
    this.updateChildren();
  },

  /**
   * need to call this to rescan children and update the "onChange" connections :
   * remove the old ones * and add the new ones
   */
  updateChildren: function() {
    // console.log('updateChildren', this, arguments);
    var self = this;
    var _oldChildrenCnts = this._childrenCnts || {};
    this._childrenCnts = {};
    this.getDescendants()
      .filter(function(item){ return !!item.onChange; })
      .forEach(function(widget) {
        if (_oldChildrenCnts.hasOwnProperty(widget.id)) {
          self._childrenCnts[widget.id] = _oldChildrenCnts[widget.id];
          delete _oldChildrenCnts[widget.id];
        } else {
          self._childrenCnts[widget.id] =
            aspect.after(widget, "onChange", lang.hitch(self, self.onChange, widget));
        }
      });
    for (var i in _oldChildrenCnts) {
      if (_oldChildrenCnts.hasOwnProperty(i)) {
        _oldChildrenCnts[i].remove();
        delete _oldChildrenCnts[i];
      }
    }
  },

  /**
   * hook - called upon value change (at any sub-input's value change)
   */
  onChange: function() {},

  /**
   * Focus on first sub-input
   */
  focus: function() {
    var widgets = this.getDescendants();
    return widgets[0].focus();
  },

  /**
   * Get child input by name
   *
   * @param {string} name
   * @return {dijit/_Widget}
   */
  getSubWidget: function(name) {
    var child = this.getDescendants()
      .filter(function(ch) { return ch.name === name; })[0];
    if (!child) {
      console.warn('getSubWidget: child not defined: ', name, this.getDescendants(), this);
      return null;
    }
    return child;
  },

  /**
   * Set value of sub-input
   *
   * @deprecated Use instead: getSubWidget(name).set("value", value)
   * @param {string} name
   * @param {mixed} value
   */
  setSubValue: function(name, value) {
    this.getSubWidget(name).set('value', value);
  },

  /**
   * Get value of sub-input
   *
   * @deprecated Use instead: getSubWidget(name).get("value")
   * @param {string} name
   * @return {mixed}
   */
  getSubValue: function(name) {
    return this.getSubWidget(name).get('value');
  },

  /**
   * @override
   */
  _setValueAttr: function(value, priorityChange) {
    if (!value) {
      this.internalValues = {};
      this.getDescendants().forEach(function(w) { w.set('value', null); });
    } else {
      //this.inherited(arguments);
      var descendants = this.getDescendants();
      var i;
      if (this.booleanUnion) {
        descendants.forEach(
          function(w) { w.set('value',
                              value.indexOf(w.get('name')) !== -1); });
      } else if (this.arrayContainer) {
        for (i = 0; i < value.length && i < descendants.length; i++) {
          descendants[i].set('value', value[i]);
        }
      } else {
        var map = {};
        descendants.forEach(function(w) { map[w.name] = w; });
        for (i in value) {
          if (!value.hasOwnProperty(i)) continue;
          if (map[i]) {
            map[i].set('value', value[i], false);
            delete this.internalValues[i];
          } else if (this.manageValueKeys.indexOf(i) !== -1) {
            this.set(i, value[i]);
          } else {
            //console.log('missing widget', i, value[i]);
            this.internalValues[i] = value[i];
          }
        }
      }
    }
    if (priorityChange || priorityChange === undefined) {
      this.onChange();
    }
  },

  /**
   * @override
   */
  _getValueAttr: function() {
    var descendants = this.getDescendants();
    var value;
    if (this.booleanUnion) {
      value = descendants.filter(function(w) { return !!w.get('value'); }).
        map(function(w) { return w.get('name'); });
    } else if (this.arrayContainer) {
      value = descendants.map(function(w) { return w.get('value'); });
      /*value = [];
        for (var i = 0; i < descendants.length; i++) {
        value.push(descendants[i].attr('value'));
        }*/
    } else {
      var self = this;
      value = lang.mixin({}, this.internalValues);
      descendants.forEach(
        function(w) { value[w.name] = w.get('value'); });
      this.manageValueKeys.forEach(
        function(p) { value[p] = self.get(p); });
    }
    this.getValueHook(value);
    return value;
  },

  /**
   * Hook: called before _getValueAttr() returns.
   *
   * The value can be modified here
   */
  getValueHook: function(value) {
    // hook
  },

  /**
   * Recursively set child inputs as read-only
   *
   * @param {boolean} state
   */
  _setReadOnlyAttr: function(state) {
    this.readOnly = state;
    if (state === true || state === false) {
      this.getDescendants().forEach(
        function(input) { input.set('readOnly', state); });
    }
  },

  /**
   * @override
   */
  startup: function() {
    this.inherited(arguments);
    this.connectChildren();
  }

});

});
