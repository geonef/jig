dojo.provide('geonef.jig.input._Container');
dojo.require('dijit.form._FormMixin');
dojo.require('geonef.jig.util');
dojo.declare('geonef.jig.input._Container', dijit.form._FormMixin,
{

  //
  // Name of this item: required if we are a child of another _Container
  name: '',

  // arrayContainer: Boolean
  //    If true, will return an array (in doc order) rather than a name/value object
  arrayContainer: false,

  // booleanUnion: Boolean
  //    If true, returned value is the array of sub-widgets' names whose value is true
  //    Implies that arrayContainer==true
  booleanUnion: false,

  // manageValueKeys: array of string
  //    All keps specified there are managed by this.attr instead of sub-widgets
  manageValueKeys: [],

  // syncThisAttr: Boolean
  //    If true, any sub-value changed will call this' setter for the attr with same name as sub-value
  //syncThisAttrs: false,

  postMixInProperties: function() {
    this.internalValues = {};
    this.manageValueKeys = dojo.clone(this.manageValueKeys);
    this.inherited(arguments);
  },

  getDescendants: function() {
    //
    // Find first descendants having a "name" attribute.
    //
    var list = [];
    this.getInputRootNodes().map(geonef.jig.util.getFirstNamedDescendants)
      .forEach(function(set) { set.forEach(function(n) { list.push(n); }); });
    return list;
    //return geonef.jig.util.getFirstNamedDescendants(this.domNode);
  },

  getInputRootNodes: function() {
    return [ this.domNode ];
  },

  connectChildren: function(){
    // summary:
    //          overload of parent's
    //
    this.inherited(arguments);
    this.updateChildren();
  },

  updateChildren: function() {
    // need to call this to rescan children
    // and update the "onChange" connections : remove the old ones
    // and add the new ones
    //var conns = this._changeConnections,
    var self = this;
    var _oldChildrenCnts = this._childrenCnts || {};
    this._childrenCnts = {};
    dojo.forEach(
      dojo.filter(this.getDescendants(),
		  function(item){ return item.onChange; }),
      function(widget) {
        if (_oldChildrenCnts.hasOwnProperty(widget.id)) {
          self._childrenCnts[widget.id] = _oldChildrenCnts[widget.id];
          delete _oldChildrenCnts[widget.id];
        } else {
          //console.log('connect', self, widget.id);
	  self._childrenCnts[widget.id] =
            dojo.connect(widget, "onChange", self,
              dojo.hitch(self, "onChange", widget));
        }
      });
    for (var i in _oldChildrenCnts) {
      if (_oldChildrenCnts.hasOwnProperty(i)) {
        //console.log('disconnect', this, i);
        dojo.disconnect(_oldChildrenCnts[i]);
      }
    }
  },


  onChange: function() {
    // hook
    //console.log('geonef.jig.input._Container onChange', this);
  },

  focus: function() {
    var widgets = this.getDescendants();
    return widgets[0].focus();
  },

  setSubValue: function(name, value) {
    var child = this.getDescendants()
      .filter(function(ch) { return ch.name === name; })[0];
    if (!child) {
      console.warn('setSubValue: child not defined: ', name, this.getDescendants(), this);
      return;
    }
    child.attr('value', value);
  },


  _setValueAttr: function(value, priorityChange) {
    //console.log('_Container _setValueAttr', this, arguments);
    if (!value) {
      this.internalValues = {};
      this.getDescendants().forEach(function(w) { w.attr('value', null); });
    } else {
      //this.inherited(arguments);
      var descendants = this.getDescendants();
      var i;
      if (this.booleanUnion) {
        descendants.forEach(
          function(w) { w.attr('value',
                               value.indexOf(w.attr('name')) !== -1); });
      } else if (this.arrayContainer) {
        for (i = 0; i < value.length && i < descendants.length; i++) {
          descendants[i].attr('value', value[i]);
        }
      } else {
        var map = {};
        descendants.forEach(function(w) { map[w.name] = w; });
        for (i in value) {
          if (!value.hasOwnProperty(i)) continue;
          if (map[i]) {
            map[i].attr('value', value[i], false);
            delete this.internalValues[i];
          } else if (this.manageValueKeys.indexOf(i) !== -1) {
            this.attr(i, value[i]);
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

  _getValueAttr: function() {
    //console.log('internal', this.internalValues, this);
    var descendants = this.getDescendants();
    var value;
    if (this.booleanUnion) {
      value = descendants.filter(function(w) { return !!w.attr('value'); }).
        map(function(w) { return w.attr('name'); });
    } else if (this.arrayContainer) {
      value = descendants.map(function(w) { return w.attr('value'); });
      /*value = [];
      for (var i = 0; i < descendants.length; i++) {
        value.push(descendants[i].attr('value'));
      }*/
    } else {
      var self = this;
      value = dojo.mixin({}, this.internalValues);
      descendants.forEach(
        function(w) { value[w.name] = w.attr('value'); });
      this.manageValueKeys.forEach(
        function(p) { value[p] = self.attr(p); });
    }
    this.getValueHook(value);
    return value;
  },

  getValueHook: function(value) {
    // hook
  }

});
