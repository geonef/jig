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

  postMixInProperties: function() {
    this.internalValues = {};
    this.inherited(arguments);
  },

  getDescendants: function() {
    //
    // Find first descendants having a "name" attribute.
    //
    return jig.util.getFirstNamedDescendants(this.domNode);
  },

  connectChildren: function(){
    // summary:
    //          overload of parent's
    //
    this.inherited(arguments);
    //var conns = this._changeConnections,
    var self = this;
    dojo.forEach(
      dojo.filter(this.getDescendants(),
		  function(item){ return item.onChange; }),
      function(widget) {
	self.connect(widget, "onChange",
            dojo.hitch(self, "onChange", widget));
      });
  },

  onChange: function() {
    // hook
    //console.log('jig.input._Container onChange', this);
  },

  focus: function() {
    var widgets = this.getDescendants();
    return widgets[0].focus();
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
        for (var i in value) {
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
