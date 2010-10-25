dojo.provide('jig.input._Container');
dojo.require('dijit.form._FormMixin');
dojo.require('jig.util');
dojo.declare('jig.input._Container', dijit.form._FormMixin,
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
  //booleanUnion: false,

  // syncThisAttr: Boolean
  //    If true, any sub-value changed will call this' setter for the attr with same name as sub-value
  //syncThisAttrs: false,

  postMixInProperties: function() {
    this.internalValues = {};
    this.inherited(arguments);
  },

  getDescendants: function() {
    //
    // Find first descendants having a "name" attribute.
    //
    var list = [];
    this.getInputRootNodes().map(jig.util.getFirstNamedDescendants)
      .forEach(function(set) { set.forEach(function(n) { list.push(n); }); });
    return list;
    //return jig.util.getFirstNamedDescendants(this.domNode);
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
    //console.log('jig.input._Container onChange', this);
  },

  focus: function() {
    var widgets = this.getDescendants();
    return widgets[0].focus();
  },

  setSubValue: function(name, value) {
    var child = this.getDescendants()
      .filter(function(ch) { return ch.name === name; })[0];
    if (!child) {
      console.error('setSubValue: child not defined: ', name, this.getDescendants(), this);
      return;
    }
    child.attr('value', value);
  },


  _setValueAttr: function(value) {
    //console.log('_Container _setValueAttr', this, arguments);
    if (!value) {
      this.internalValues = {};
      this.getDescendants().forEach(function(w) { w.attr('value', null); });
    } else {
      //this.inherited(arguments);
      var descendants = this.getDescendants();
      var i;
      if (this.arrayContainer) {
        for (i = 0; i < value.length && i < descendants.length; i++) {
          descendants[i].attr('value', value[i]);
        }
      } else {
        var map = {};
        descendants.forEach(function(w) { map[w.name] = w; });
        for (i in value) {
          if (!value.hasOwnProperty(i)) continue;
          if (map[i]) {
            map[i].attr('value', value[i]);
            delete this.internalValues[i];
          } else {
            //console.log('missing widget', i, value[i]);
            this.internalValues[i] = value[i];
          }
        }
      }
    }
    this.onChange();
  },

  _getValueAttr: function() {
    //console.log('internal', this.internalValues, this);
    var descendants = this.getDescendants();
    var value;
    if (this.arrayContainer) {
      /*if (booleanUnion) {

      }*/
      value = [];
      for (var i = 0; i < descendants.length; i++) {
        value.push(descendants[i].attr('value'));
      }
    } else {
      value = dojo.mixin({}, this.internalValues);
      descendants.forEach(
        function(w) { value[w.name] = w.attr('value'); });
    }
    return value;
  }

});
