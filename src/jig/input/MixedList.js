
dojo.provide('jig.input.MixedList');

// parents
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');

// used in template
dojo.require('dijit.form.DropDownButton');
dojo.require('dijit.TooltipDialog');

// used in code
dojo.require('dojo.dnd.Source');

dojo.declare('jig.input.MixedList', [ dijit._Widget, dijit._Templated ],
{
  // summary:
  //   List of objects, which are represented through objects of different classes
  //
  // description:
  //   The class name is found by concatanating this.childClassPrefix with the
  //   value of the property names with this.childClassSuffixProperty.
  //

  ////////////////////////////////////////////////////////////////////
  // External properties (set via constructor or attr setter)

  /**
   * Input name
   *
   * @type {string}
   */
  name: 'list',

  label: 'List',

  childClassPrefix: '',

  childClassSuffixProperty: 'module',

  availableModules: [],

  listType: 'div',

  /**
   * If true, the display order will be the inverse of value order
   *
   * @type {boolean}
   */
  reverseOrder: false,

  /**
   * Disable create and re-order capabilities (not forwarded to nested inputs)
   *
   * @type {boolean}
   */
  readOnly: false,

  /**
   * Display add button at bottom rathan than top
   *
   * @type {boolean}
   */
  addButtonAtBottom: false,

  /**
   * Label for add button
   *
   * @type {string}
   */
  addButtonLabel: 'Ajouter',


  ////////////////////////////////////////////////////////////////////
  // Protected properties

  templateString: dojo.cache("jig.input", "templates/MixedList.html"),

  widgetsInTemplate: true,

  // attributeMap: object
  //    Attribute map (dijit._Widget)
  attributeMap: dojo.mixin(dojo.clone(dijit._Widget.prototype.attributeMap), {
    //label: { node: 'labelNode', type: 'innerHTML' }
  }),

  postMixInProperties: function() {
    this.inherited(arguments);
    this.widgets = [];
  },

  buildRendering: function() {
    this.inherited(arguments);
    this.buildListNodes();
    this.createDnd();
  },

  postCreate: function() {
    this.inherited(arguments);
    dojo.style(this.button.domNode, 'display', this.readOnly ? 'none': '');
  },

  buildListNodes: function() {
    var position = this.addButtonAtBottom ? 'first' : 'last';
    var dc = dojo.create;
    if (this.listType === 'div') {
      this.listNode = dc('div', { 'class': 'list' }, this.domNode, position);
    } else if (this.listType === 'table') {
      var table = dc('table', { 'class': 'jigList' }, this.domNode, position);
      this.listNode = dc('tbody', {}, table);
    } else {
      throw new Error('invalid listType param: '+this.listType);
    }
  },

  createDnd: function() {
    if (this.readOnly) { return; }
    this.listNode.dndType = this.id;
    this.listNode.type = this.id;
    this.dnd = new dojo.dnd.Source(
      this.listNode,
      {
        withHandles: true,
        singular: true,
        autoSync: true,
        accept: this.id+'-dnd',
        creator: dojo.hitch(this, 'dndAvatarCreator')
      });
    this.connect(this.dnd, 'onDrop', 'onChange');
  },

  dndAvatarCreator: function(item) {
    var avatar = dojo.create('div', { innerHTML: "Déplacement..." });
    return { node: avatar, data: item, type: this.id+'-dnd' };
  },

  _getValueAttr: function() {
    var value = dojo.query('> *', this.listNode)
      .map(dijit.byNode)
      .map(function(w) { return w.attr('value'); });
    if (this.reverseOrder) {
      value.reverse();
    }
    return [].concat(value);
  },

  _setValueAttr: function(value) {
    //console.log('setValue mixed', this, value);
    this.updatingValue = true;
    var widgets = this.widgets.filter(function() { return true; });
    widgets.forEach(function(w) { w.destroy(); });
    var self = this;
    if (value) {
      if (dojo.isArray(value)) {
        if (this.reverseOrder) {
          value = value.slice(0); // don't modify parameter
          value.reverse();
        }
        value.forEach(function(item) { this.addItem(item, true); }, this);
      } else {
        console.warn('value is not an array:', value, 'for:', this);
      }
    }
    this.onResize();
    if (this.dnd) {
      this.dnd.sync();
    }
    this.updatingValue = false;
    //console.log('** end setValue mixed');
  },

  addItem: function(item, dontResize_) {
    //console.log('add item', this, arguments);
    var widget = this.makeWidgetFromItem(item);
    this.widgets.push(widget);
    this.addWidgetToUi(widget);
    if (dontResize_ !== true) {
      this.onResize();
    }
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
    var self = this;
    var dc = dojo.connect;
    var _cnt = [
      dc(widget, 'destroy', this,
         function() {
           _cnt.forEach(dojo.disconnect);
           var idx = self.widgets.indexOf(widget);
           if (idx !== -1) {
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
    widget.placeAt(this.listNode);
    widget.startup();
  },

  onResize: function() {
    // because we're not _Contained
  }

});

dojo.provide('jig.input._MixedGridCreateList');

// parents
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
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
