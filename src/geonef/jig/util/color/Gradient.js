
dojo.provide('geonef.jig.util.color.Gradient');

dojo.declare('geonef.jig.util.color.Gradient', null,
{
  color1: [0,0,0],
  color2: [0,0,0],

  /**
   * @param {Array.<number>} color1
   * @param {Array.<number>} color2
   */
  constructor: function(color1, color2) {
    this.color1 = color1;
    this.color2 = color2;
  },

  /**
   * @param {number} position between 0 and 1
   */
  getColor: function(position) {
    var ret = [null, null, null];
    for (var i = 0; i < 3; ++i) {
      ret[i] = this.color1[i] +
        (this.color2[i] - this.color1[i]) * position;
    }
    return ret;
  },

  getColorCssHsl: function(position) {
    var color = this.getColor(position);
    return 'hsl('+color[0]+','+color[1]+'%,'+color[2]+'%)';
  },

  clone: function() {
    var clone = new geonef.jig.util.color.Gradient({
                  color1: this.color1.slice(0),
                  color2: this.color2.slice(0) });
    return clone;
  },


});