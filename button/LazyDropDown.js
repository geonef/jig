/**
 * Specialization of dijit/form/dropDownButton to provide automatic sub-widget lazy-loading
 *
 * It must be given a 'ddClass', unless 'ddCreateFunc' is given.
 */
define([
         "dojo/_base/declare",
         "dijit/form/DropDownButton",
         "dijit/TooltipDialog",
         "dijit/popup",
         "dojo/_base/lang",
         "dojo/dom-construct",
         "dojo/dom-style",
         "dojo/Deferred"
], function(declare, DropDownButton, TooltipDialog, popup, lang, construct, style, Deferred) {


return declare('geonef.jig.button.TooltipWidget', DropDownButton,
{
  /**
   * @override
   */
  label: 'DD',

  /**
   * Widget class to instanciate for dropdown
   *
   * @type {Function}
   */
  ddClass: 'dijit.layout.ContentPane',

  /**
   * Options to give to 'ddClass' constructor
   *
   * @type {Object}
   */
  ddOptions: {},

  /**
   * Style object to apply to dd's domNode
   *
   * @type {Object}
   */
  ddStyle: {},

  /**
   * Promise when the dropdown widget is loaded (resolved to the widget)
   *
   * @type {dojo/Deferred}
   */
  whenDDLoaded: null,

  /**
   * @override
   */
  postMixInProperties: function() {
    this.whenDDLoaded = new Deferred();
    this.inherited(arguments);
    this.ddOptions = lang.mixin({}, this.ddOptions);
  },

  /**
   * @override
   */
  startup: function() {
    if (this._started){ return; }

    this.dropDown = { _destroyed: true };
    // no parent has an interesting startup method

    //this.dropDownContainer = null;	// hack to make parent (DropDownButton)
    // to assume first widget in body as dropDown
    // and leave isLoaded() do the proper work
    //this.inherited(arguments);
    //this.dropDown = null;
  },

  widgetCreateFunc: function() {
    var Class = this.ddClass;
    var widget = new Class(lang.mixin({}, this.ddOptions));
    widget._floatAnchor = true;
    style.set(widget.domNode, this.ddStyle);
    return widget;
  },

  openDropDown: function() {
    this.inherited(arguments);
    if (this.subWidget && this.subWidget.onShow) {
      this.subWidget.onShow(this);
    }
  },

  /**
   * Loads the data for the dropdown, and at some point, calls the given callback
   */
  loadDropDown: function(loadCallback){
    this.dropDown = this.createDropDownTooltip();
    if (this.subWidget) {
      loadCallback();
      this.subWidget.startup();
      this.whenDDLoaded.resolve(this.subWidget);
    }
  },

  createDropDownTooltip: function() {
    var dd = new TooltipDialog({
      removeChild: lang.hitch(this, 'removeSubWidget')
    });
    this.subWidget = this.widgetCreateFunc();
    this._isJigLoaded = !!this.subWidget;
    if (this.subWidget) {
      this.subWidget._floatAnchor = true;
      construct.place(this.subWidget.domNode, dd.containerNode); // no addChild!
      this.connect(this.subWidget, 'onResize', 'onDropDownResize');
    }
    return dd;
  },

  removeSubWidget: function() {
    this.subWidget.domNode.parentNode.removeChild(this.subWidget.domNode);
    this.closeDropDown();
    this._isJigLoaded = false;
  },

  /**
   * @override
   */
  isLoaded: function(){
    return !!this._isJigLoaded;
  },

  /**
   * @override
   */
  closeDropDown: function(/*Boolean*/ focus){
    if (this.subWidget && this.subWidget.onHide) {
      this.subWidget.onHide(this);
    }
    if(this._opened){
      popup.close(this.dropDown);
      if(focus){ this.focus(); }
      this._opened = false;
      this.state = "";
    }
  },

  /**
   * Event: triggered from dropdown's 'onResize' event
   */
  onDropDownResize: function() {
    if (this._opened) {
      this.closeDropDown();
      this.openDropDown();
    }
  },

  /**
   * Helper for setting an attr on the (maybe future) dropdown
   *
   * If the dropdown is loaded, the attr is set immediately, otherwise
   * it is stored for later settings upong loading
   */
  subAttr: function(name, value) {
    if (this.subWidget) {
      this.subWidget.attr(name, value);
    } else {
      this.ddOptions[name] = value;
    }
  }

});

});
