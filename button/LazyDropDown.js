/**
 * Specialization of dijit/form/dropDownButton to provide automatic sub-widget lazy-loading
 *
 * It must be given a 'ddClass', unless 'ddCreateFunc' is given.
 */
define([
  "module",
  "dojo/_base/declare",
  "./DropDown",
  "dijit/TooltipDialog",
  "dijit/popup",
  "dojo/_base/lang",
  "dojo/dom-construct",
  "dojo/dom-style",
  "dojo/Deferred",
  "../util/value"
], function(module, declare, DropDown, TooltipDialog, popup, lang,
            construct, style, Deferred, value) {


return declare(DropDown, { //--noindent--

  /**
   * @override
   */
  label: 'DD',

  /**
   * Widget class to instanciate for dropdown
   *
   * @type {Function|string}
   */
  ddClass: null,

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
    this.inherited(arguments);
    // no parent has an interesting startup method

    //this.dropDownContainer = null;	// hack to make parent (DropDownButton)
    // to assume first widget in body as dropDown
    // and leave isLoaded() do the proper work
    //this.inherited(arguments);
    //this.dropDown = null;
  },

  /**
   * @override
   */
  openDropDown: function() {
    this.inherited(arguments);
    if (this.subWidget && this.subWidget.onShow) {
      this.subWidget.onShow(this);
    }
  },

  /**
   * Loads the data for the dropdown, and at some point, calls the given callback
   *
   * @override
   */
  loadDropDown: function(loadCallback) {
    var _this = this;
    this.createDropDownTooltip().then(function(dropDown) {
      _this.dropDown = dropDown;
      if (_this.subWidget) {
        loadCallback();
        // _this.subWidget.startup();
        _this.whenDDLoaded.resolve(_this.subWidget);
      }
    });
  },

  /**
   * Create the tooltip, including the dropdown (async)
   *
   * @return {dojo/Deferred}
   */
  createDropDownTooltip: function() {
    var dd = new TooltipDialog({
      removeChild: lang.hitch(this, 'removeSubWidget')
    });
    var _this = this;
    return this.widgetCreateFunc().then(function(subWidget) {
      _this.subWidget = subWidget;
      _this._isJigLoaded = !!_this.subWidget;
      if (_this.subWidget) {
        _this.subWidget._floatAnchor = true;
        construct.place(_this.subWidget.domNode, dd.containerNode); // no addChild!
        _this.connect(_this.subWidget, 'onResize', 'onDropDownResize');
      }
      return dd;
    });
  },

  /**
   * Create the dropdown widget (async)
   *
   * @return {dojo/Deferred}
   */
  widgetCreateFunc: function() {
    var _this = this;
    return value.getModule(this.ddClass).then(function(_Class) {
      var widget = new _Class(lang.mixin({}, _this.ddOptions));
      widget._floatAnchor = true;
      style.set(widget.domNode, _this.ddStyle);
      return widget;
    });
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
  },

  declaredClass: module.id

});

});
