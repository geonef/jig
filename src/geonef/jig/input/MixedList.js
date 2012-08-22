define([
         "dojo/_base/declare",
         "dijit/_Widget",
         "dijit/_TemplatedMixin",
         "dijit/_WidgetsInTemplateMixin",
         "../widget/_AutoGrid",

         "../util",
         "dojo/_base/lang",
         "dojo/dom-construct",
         "dojo/dom-style",
         "dojo/query",
         "dojo/aspect",
         "dojo/dnd/Source",
         "dijit/registry",

         "../button/Action",
         "dijit/form/DropDownButton",
         "dijit/TooltipDialog",
         "dojo/text!./templates/MixedList.html"
], function(declare, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _AutoGrid,
            util, lang, construct, style, query, aspect, Source, registry,
            Action, DropDownButton, TooltipDialog, template) {


/**
 * Button to choose the type
 *
 * TODO: avoid global def, when coberting template to makeDOM()
 */
declare('geonef.jig.input._MixedGridCreateList',
        [ _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, _AutoGrid ],
{
  label: 'Créer nouveau',

  mixedListWidget: '',

  postMixInProperties: function() {
    this.inherited(arguments);
    this.mixedListWidget = registry.byId(this.mixedListWidget);
  },


  getGridMembers: function() {
    return this.mixedListWidget.availableModules;
  },

  processGridMember: function(member, tr) {
    var self = this
    , button = new Action({
                 label: member,
	         onClick: function() {
                   var item = {};
                   item[self.mixedListWidget.childClassSuffixProperty] = member;
                   self.mixedListWidget.addItem(item);
	         }});
    ;
    construct.place(button.domNode, tr);
    button.startup();
  }


});


return declare('geonef.jig.input.MixedList', [ _Widget, _WidgetsInTemplateMixin ],
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

  templateString: template,

  widgetsInTemplate: true,


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
    style.set(this.button.domNode, 'display', this.readOnly ? 'none': '');
  },

  buildListNodes: function() {
    var position = this.addButtonAtBottom ? 'first' : 'last';
    var dc = construct.create;
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
    this.dnd = new Source(
      this.listNode,
      {
        withHandles: true,
        singular: true,
        autoSync: true,
        accept: this.id+'-dnd',
        creator: lang.hitch(this, 'dndAvatarCreator')
      });
    this.connect(this.dnd, 'onDrop', 'onChange');
  },

  dndAvatarCreator: function(item) {
    var avatar = construct.create('div', { innerHTML: "Déplacement..." });
    return { node: avatar, data: item, type: this.id+'-dnd' };
  },

  _getValueAttr: function() {
    var value = query('> *', this.listNode)
      .map(registry.byNode)
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
      if (value instanceof Array) {
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
    var Class = util.getClass(className);
    var widget = new Class();
    widget.attr('value', item);
    this.installConnectsOnWidget(widget);
    return widget;
  },

  installConnectsOnWidget: function(widget) {
    var self = this;
    var dc = aspect.connect;
    var _cnt = [
      dc(widget, 'destroy', this,
         function() {
           _cnt.forEach(function(_c) { _c.remove(); });
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

});
