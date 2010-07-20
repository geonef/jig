
dojo.provide('jig.input.MixedList');

// parents
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');

// used in template
dojo.require('dijit.form.DropDownButton');
dojo.require('dijit.TooltipDialog');

dojo.declare('jig.input.MixedList', [ dijit._Widget, dijit._Templated ],
{
  // summary:
  //   List of objects, which can be of different types
  //

  templateString: dojo.cache("jig.input", "templates/MixedList.html"),

  widgetsInTemplate: true,

  name: 'list',
  label: 'List',
  childClassPrefix: '',
  childClassSuffixProperty: 'module',
  availableModules: [],

  // attributeMap: object
  //    Attribute map (dijit._Widget)
  attributeMap: dojo.mixin(dojo.clone(dijit._Widget.prototype.attributeMap), {
    label: { node: 'labelNode', type: 'innerHTML' }
  }),

  postMixInProperties: function() {
    this.inherited(arguments);
    this.widgets = [];
  },

  _getValueAttr: function() {
    return this.widgets.map(
      function(w) { return w.attr('value'); });
  },

  _setValueAttr: function(value) {
    console.log('setValue mixed', this, arguments);
    this.widgets.forEach(function(w) { w.destroy(); });
    this.widgets = [];
    var self = this;
    if (value) {
      if (dojo.isArray(value)) {
        value.forEach(dojo.hitch(this, 'addItem'));
      } else {
        console.warn('value is not an array:', value, 'for:', this);
      }
    }
  },

  addItem: function(item) {
    //console.log('add item', this, arguments);
    var widget = this.makeWidgetFromItem(item);
    this.widgets.push(widget);
    this.addWidgetToUi(widget);
  },


  inflectClassName: function(item) {
    return this.childClassPrefix + item[this.childClassSuffixProperty];
  },

  makeWidgetFromItem: function(item) {
    var className = this.inflectClassName(item);
    var Class = jig.util.getClass(className);
    var widget = new Class();
    widget.attr('value', item);
    return widget;
  },

  addWidgetToUi: function(widget) {
    dojo.place(widget.domNode, this.listNode);
    widget.startup();
  }

});

dojo.provide('jig.input._MixedGridCreateList');

// parents
dojo.require('jig.widget._AutoGrid');

dojo.declare('jig.input._MixedGridCreateList',
             [ dijit._Widget, dijit._Templated, jig.widget._AutoGrid ],
{
  // summary:
  //   button to choose the type
  //

  label: 'Créer nouveau',

  mixedListWidget: '',

  postMixInProperties: function() {
    this.inherited(arguments);
    this.mixedListWidget = dijit.byId(this.mixedListWidget);
  },


  getGridMembers: function() {
    return this.mixedListWidget.availableModules;
  },

  processGridMember: function(member, tr) {
    //console.log('mgc process grid member', this, arguments);
    var
      //buttonNode = dojo.create('button', {}, tr)
    //, img = dojo.create('img', { src: Class.prototype.icon }, buttonNode)
    //, br = dojo.create('br', {}, buttonNode)
    //, span = dojo.create('span', { innerHTML: member }, buttonNode)
      self = this
    , button = new jig.button.Action({
                 label: member,
	         onClick: function() {
                   var item = {};
                   item[self.mixedListWidget.childClassSuffixProperty] = member;
                   self.mixedListWidget.addItem(item);
	         }});
    ;
    dojo.place(button.domNode, tr);
    button.startup();
  }


});
