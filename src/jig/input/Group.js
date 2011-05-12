dojo.provide('jig.input.Group');

dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('jig.input._Container');

dojo.declare('jig.input.Group',
		[ dijit._Widget, dijit._Templated, jig.input._Container ],
{

  templateString: '<div dojoAttachPoint="containerNode"></div>'

});
