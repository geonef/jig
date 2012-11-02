define([
         "require",
         "dojo/_base/declare",
         "geonef/jig/_Widget",
         "dojo/_base/kernel",
         "dojo/dom-style",
         "dojo/_base/fx",
         "dojo/fx/easing",
         "../util/async"
], function(require, declare, _Widget, dojo, style, fx, easing, async) {


/**
 * Widget quickly added to a widget while processing (API requested, etc)
 *
 * @class
 */
return declare(_Widget,
{

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
         ["img", { src: this.iconUrl + "/spinner32.gif",
                   alt: "Loading..." }]
       ]],

    ];
  },

  postCreate: function() {
    this.inherited(arguments);
    if (this.processingNode && !this.domNode.parentNode) {
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
          if (!dojo.global.__debug_keepProcessing) {
            destroy();
          }
        }
      }).play();
  }

});

});
