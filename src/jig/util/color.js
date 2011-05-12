
dojo.provide('jig.util.color');

dojo.require('jig.util');

dojo.mixin(jig.util.color,
{
  /**
   * Return whether the color is rather dark than bright
   *
   * Typically used to know what foreground color to use over the given
   * background color (or vice-versa) to make labels visible.
   *
   * @return {boolean}
   */
  isDark: function(color) {
    var col = jig.util.color.toArray(color);
    return Math.max.apply(null, col) < 16 * 11;
  },

  /**
   * Transfor color string like #6a3b41 to value array like [106,59,65]
   *
   * @return {Array.<number>}
   */
  toArray: function(color) {
    var col = jig.util.color.normalize(color);
    return [parseInt(col.substr(1, 2), 16),
            parseInt(col.substr(3, 2), 16),
            parseInt(col.substr(5, 2), 16)];
  },

  /**
   * Normalize color, to always get #rrggbb hex string
   *
   * @return {string}
   */
  normalize: function(color) {
    var col = color.substr(color[0] === '#' ? 1 : 0);
    if (col.length === 3) {
      col = col[0]+col[0]+col[1]+col[1]+col[2]+col[2];
    }
    return '#'+col;
  }

});
