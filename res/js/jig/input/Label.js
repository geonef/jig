
dojo.provide('ploomap.input.Label');

// parents
dojo.require('dijit._Widget');

dojo.declare('ploomap.input.Label', dijit._Widget,
{
  // summary:
  //   Dumb span that show the input value. No edition.
  //

  name: '',
  value: '',
  isMapped: false,
  map: '',

  buildRendering: function() {
    this.domNode = dojo.create('span', {});
  },

  _setIsMappedAttr: function(isMapped) {
    this.isMapped = isMapped;
    this.attr('value', this.value);
  },

  _setMapAttr: function(map) {
    if (dojo.isString(map)) {
      map = dojo.getObject(map);
    }
    this.map = map;
    this.attr('value', this.value);
  },

  _setValueAttr: function(value) {
    this.value = value;
    var display = this.isMapped ? this.map[value] : value;
    this.domNode.innerHTML = display;
  }

});
