
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
    //label: { node: 'labelNode', type: 'innerHTML' }
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
    //console.log('setValue mixed', this, value);
    this.updatingValue = true;
    var widgets = this.widgets.filter(function() { return true; });
    widgets.forEach(function(w) { w.destroy(); });
    var self = this;
    if (value) {
      if (dojo.isArray(value)) {
        value.forEach(dojo.hitch(this, 'addItem'));
      } else {
        console.warn('value is not an array:', value, 'for:', this);
      }
    }
    this.updatingValue = false;
    //console.log('** end setValue mixed');
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
    this.installConnectsOnWidget(widget);
    return widget;
  },

  installConnectsOnWidget: function(widget) {
    console.log('installConnectsOnWidget', this, arguments);
    var self = this;
    var dc = dojo.connect;
    var _cnt = [
      dc(widget, 'destroy', this,
         function() {
           _cnt.forEach(dojo.disconnect);
           var idx = self.widgets.indexOf(widget);
           if (idx !== -1) {
             console.log('removed w from list', idx, widget);
             self.widgets.splice(idx, 1);
           } else {
             console.warn('widget not in list (at destroy)', widget);
           }
         }),
      dc(widget, 'onChange', this,
         function() {
           //console.log('trigger onChange for widget', widget);
           if (!self.updatingValue) {
             self.onChange();
           }
         })
    ];
  },

  onChange: function() {
    // hook
    // this is called a bit too often, because onChange events
    // are difficult to wrap as they seem to be fired asynchronously
    //console.log('onChange', this, arguments);
  },

  destroy: function() {
    this.widgets.forEach(function(w) { w.destroy(); });
    this.inherited(arguments);
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
