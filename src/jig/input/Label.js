
dojo.provide('geonef.jig.input.Label');

// parents
dojo.require('dijit._Widget');

/**
 * Dumb HTMLElement whose innerHTML is updated with this' value. Read-only.
 *
 * A value map can be specified, see property isMapped.
 *
 * @class geonef.jig.input.Label
 */
dojo.declare('geonef.jig.input.Label', dijit._Widget,
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
   * If a string is provided, it is used through dojo.getObject to get
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


  filter: function(v) { return v; },

  buildRendering: function() {
    if (!this.domNodeName) {
      this.domNodeName = this.srcNodeRef ?
        this.srcNodeRef.nodeName.toLowerCase() : 'span';
    }
    this.domNode = dojo.create(this.domNodeName, {});
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
    value = this.filter(value);
    this.value = value;
    var display = this.isMapped ? this.map[value] : value;
    this.domNode.innerHTML = display;
  }

});
