dojo.provide('jig.input._Container');
dojo.require('dijit.form._FormMixin');
dojo.require('jig.util');
dojo.declare('jig.input._Container', dijit.form._FormMixin,
{

  //
  // Name of this item: required if we are a child of another _Container
  name: '',

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
    if (!value) {
      this.getDescendants().forEach(function(w) { w.attr('value', null); });
    } else {
      this.inherited(arguments);
    }
  }


});
