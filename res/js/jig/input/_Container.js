dojo.provide('jig.input._Container');
dojo.require('dijit.form._FormMixin');
dojo.declare('jig.input._Container', dijit.form._FormMixin,
{

  //
  // Name of this item: required if we are a child of another _Container
  name: '',

  getDescendants: function() {
    //
    // Find immediate children input widgets
    // Because we are a container, so for the logic,
    // we often need to interact with the children.
    //
    return dijit.findWidgets(this.domNode);
  },

  connectChildren: function(){
    // summary:
    //          overload of parent's
    //
    this.inherited(arguments);
    var conns = this._changeConnections,
    _this = this;
    dojo.forEach(
      dojo.filter(this.getDescendants(),
		  function(item){ return item.validate; }),
      function(widget){
	conns.push(_this.connect(widget, "onChange",
				 dojo.hitch(_this, "onChange", widget)));
      });
  },

  onChange: function() {
    // hook
    //console.log('jig.input._Container onChange', this);
  },

  focus: function() {
    var widgets = this.getDescendants();
    return widgets[0].focus();
  }

});
