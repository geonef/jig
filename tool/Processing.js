/**
 * Widget quickly added to a widget while processing (API requested, etc)
 *
 */
define([
  "module", "require",
  "dojo/_base/declare",
  "geonef/jig/_Widget",
  "dojo/_base/window",
  "dojo/dom-style",
  "dojo/_base/fx",
  "dojo/fx/easing",
  "../util/async"
], function(module, require, declare, _Widget, window, style, fx, easing, async) {

return declare(_Widget, { //--noindent--

  /**
   * @type {?HTMLElement}
   */
  processingNode: null,

  fxAppearDuration: 400,
  fxDisappearDuration: 200,

  iconUrl: require.toUrl('geonef/jig/style/icon'),

  "class": _Widget.prototype["class"] + " jigWidgetProcessing",


  makeContentNodes: function() {
    return [
      ["div", {"class": "bg"}, "&nbsp;"],
      ["div", {"class": "content"}, [
        // ["img", { src: this.iconUrl + "/spinner32.gif",
        //           alt: "Loading..." }]
      ]],

    ];
  },

  postCreate: function() {
    this.inherited(arguments);
    if (this.processingNode && !this.domNode.parentNode) {
      // console.log("style.get(this.processingNode, 'position')", );
      if (style.get(this.processingNode, 'position') === 'static') {
        style.set(this.processingNode, 'position', 'relative');
      }
      this.placeFx(this.processingNode);
    }
  },

  placeFx: function(node) {
    style.set(this.domNode, 'opacity', 0);
    this.placeAt(node);
    var _this = this;
    this.placeAnim = fx.animateProperty(
      {
        node: this.domNode, duration: this.fxAppearDuration,
	properties: {
          opacity: { start: 0, end: 1 }
        },
	easing: easing.sinIn,
        onEnd: function() {
          delete _this.placeAnim;
        }
      });
    this.placeAnim.play();
  },


  startup: function() {

  },

  end: function() {
    this.destroyFx();
  },

  destroyFx: function() {
    if (this._destroyed) { return; }
    if (this.placeAnim) {
      this.placeAnim.stop(false);
      delete this.placeAnim;
    }
    var destroy = async.deferHitch(this, this.destroy);
    fx.animateProperty(
      {
        node: this.domNode, duration: this.fxDisappearDuration,
	properties: {
          opacity: { start: 1, end: 0 }
        },
	easing: easing.sinIn,
        onEnd: function() {
          if (!window.global.__debug_keepProcessing) {
            destroy();
          }
        }
      }).play();
  },

  declaredClass: module.id

});

});
