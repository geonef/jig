define([
         "dojo/_base/declare",
], function(declare) {

/**
 * Class for handling simple HSL color gradients
 *
 * The HSL colors here are 3-element arrays:
 *      [0]: hue (angle of the color circle), in [0 ; 360[
 *      [1]: saturation (percentage), in [0 ; 100]
 *      [2]: lightness (percentage), in [0 ; 100]
 *
 * @see http://www.w3.org/TR/2008/WD-css3-color-20080721/#hsl-color
 */
var Self = declare(null,
{
  color1: [0,0,0],
  color2: [0,0,0],

  /**
   * Construct the gradient from 2 colors
   *
   * @param {Array.<number>} color1
   * @param {Array.<number>} color2
   */
  constructor: function(color1, color2) {
    this.color1 = color1;
    this.color2 = color2;
  },

  /**
   * Get color at given position from the gradient
   *
   * @param {number} position in [0 ; 1]
   * @return {Array.<number>}
   */
  getColor: function(position) {
    var ret = [null, null, null];
    for (var i = 0; i < 3; ++i) {
      ret[i] = this.color1[i] +
        (this.color2[i] - this.color1[i]) * position;
    }
    return ret;
  },

  /**
   * Same as getColor(), returns color in hsl() form
   *
   * @param {number} position in [0 ; 1]
   * @return {string} expression like: "hsl(120,80%,30%)"
   */
  getColorCssHsl: function(position) {
    var color = this.getColor(position);
    return 'hsl('+color[0]+','+color[1]+'%,'+color[2]+'%)';
  },

  /**
   * Clone this gradient
   *
   * @return {geonef.jit.util.color.Gradient}
   */
  clone: function() {
    var clone = new Self({
                  color1: this.color1.slice(0),
                  color2: this.color2.slice(0) });
    return clone;
  }

});

return Self;
});
