dojo.provide('geonef.jig.input.Group');

dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('geonef.jig.input._Container');

dojo.declare('geonef.jig.input.Group',
		[ dijit._Widget, dijit._Templated, geonef.jig.input._Container ],
{

  templateString: '<div dojoAttachPoint="containerNode"></div>'

});
