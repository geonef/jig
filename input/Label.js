define([
         "dojo/_base/declare",
         "dijit/_Widget",
         "dojo/_base/lang",
         "dojo/dom",
         "dojo/dom-construct",
         "dojo/dom-style",
], function(declare, _Widget, lang, dom, construct, style) {


/**
 * Dumb HTMLElement whose innerHTML is updated with this' value - READ-ONLY
 *
 * This won't be much useful unless specific functionalities are used,
 * such as isMapped/map or hideElementIfFalsy.
 *
 * A value map can be specified, see property isMapped.
 *
 * @class geonef/jig/input/Label
 */
return declare(_Widget,
{
  /**
   * Input name
   *
   * @type {string}
   */
  name: '',

  /**
   * Input value (read-only)
   *
   * @type {string}
   */
  value: '',

  /**
   * Whether to use a mapping table for value/label
   *
   * @type {boolean}
   */
  isMapped: false,

  /**
   * Mapping table
   *
   * Object keys are possible values, object values are labels.
   *
   * If a string is provided, it is used through dojo/getObject to get
   * the mapping table. Useful for instanciating this widget from markup
   * with an attribute like map="some.widget.prototype.mapTable".
   *
   * @type {Object.<string, string>|string}
   */
  map: '',

  /**
   * Typically "div" or "span".
   *
   * If not specified, the srcNodeRef nodeName is used, or "span".
   *
   * @type {string}
   */
  domNodeName: '',

  /**
   * Read-only - always true.
   *
   * The value can be set prorgammatically (and UI is updated), but no way
   * to change the value from the UI.
   *
   * @type {boolean}
   */
  readOnly: true,

  /**
   * ID of element to hide if the value is set null
   *
   * @type {string}
   */
  hideElementIfFalsy: '',


  filter: function(v) { return v; },

  buildRendering: function() {
    if (!this.domNodeName) {
      this.domNodeName = this.srcNodeRef ?
        this.srcNodeRef.nodeName.toLowerCase() : 'span';
    }
    this.domNode = construct.create(this.domNodeName, {'class':'jigInputLabel'});
  },

  startup: function() {
    this.inherited(arguments);
    this.updateFalsy();
  },

  updateFalsy: function() {
    if (this.hideElementIfFalsy && this._started) {
      if (typeof this.hideElementIfFalsy == 'string') {
        this.hideElementIfFalsy = dom.byId(this.hideElementIfFalsy);
      }
      var falsy = !this.value ||
        (typeof this.value == 'string' && lang.trim(this.value) === '0');
      style.set(this.hideElementIfFalsy, 'display',
                falsy ? 'none' : '');
    }
  },


  _setIsMappedAttr: function(isMapped) {
    this.isMapped = isMapped;
    this.attr('value', this.value);
  },

  _setMapAttr: function(map) {
    if (typeof map == 'string') {
      map = lang.getObject(map);
    }
    this.map = map;
    this.attr('value', this.value);
  },

  _setValueAttr: function(value) {
    value = this.filter(value);
    this.value = value;
    if (value && !this.isMapped && typeof value == 'object') {
      if (value.getSummary) {
        value = value.getSummary();
      } else if (value.toString) {
        value = value.toString();
      }
    }
    var display = '';
    if (value !== null && value !== undefined) {
      display = this.isMapped ? this.map[value] : value;
    }
    this.domNode.innerHTML = display;
    this.updateFalsy();
  },

  _setHideElementIfFalsyAttr: function(elementId) {
    this.hideElementIfFalsy = elementId;
    this.updateFalsy();
  }

});

});
