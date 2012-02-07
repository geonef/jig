
dojo.provide('geonef.jig.util.number');

dojo.require('geonef.jig.util');

/**
 * Utility functions dealing with angles
 */
dojo.mixin(geonef.jig.util.number,
{
  /**
   * Format a number
   *
   * Forwarded to dojo.number.format, but before, the number is
   * rounded depending on the "digits" option.
   *
   * @param {number} value
   * @param {Object} options
   * @return {string}
   */
  format: function(value, options) {
    if (options && options.digits) {
      var nb = Math.ceil(Math.log(value) / Math.LN10);
      var factor = nb < options.digits ? Math.pow(10, options.digits - nb) : 1;
      value = Math.round(value * factor) / factor;
    }
    return dojo.number.format(value, options);
  },


  /**
   * Format an array of numbers (called "dimensions")
   *
   * Can typically work on 2D or 3D coordinates, sizes...
   * Can also work on simple numbers (call: formatDims([number]))
   *
   * Examples:
   *      formatDims([fileWeight], { mult: 1024,
   *                                 units: ['B', 'KiB', 'MiB', 'GiB' ]})
   *      formatDims([width, height], { units ['m', 'km'] })
   *
   * @param {Array.<number>} dims Array of float numbers so that dims.length >= 1
   * @param {Object} options Used to override default options. Options are:
   *          mult: exp base between units
   *          units: array
   *                  string array specifying the unit names in powers
   *                  of "options.mult".
   *          preci: float
   *                  precision for decimal part (ex: 0.1, 0.01, 0.001 ...)
   *          joinSep: string
   *                  separator for numbers serialization (join)
   *
   *      Specify options.mult for no-SI units (ex: KiB, MiB use 1024)
   * @return {string}
   */
  formatDims: function(dims, options) {
    var o = dojo.mixin(
      {
        units: [ '', 'K', 'M' ],
        mult: 1000,
        preci: 0.1,
        joinSep: ', ',
        decimalSep: ','
      }, options);
    var
      max = Math.max.apply(null, dims)
    , logNp = function(x, base) {
                return Math.max(0, Math.floor(Math.log(x) / Math.log(base))); }
    , exp = Math.min(logNp(max, o.mult), o.units.length - 1)
    , getU = function(x) { return x < 0 ? x :
                           Math.round((x / Math.pow(o.mult, exp)) *
                                      (1 / o.preci)) / (1 / o.preci); }
    , commaR = function(s) { return (''+s).replace(/\./, o.decimalSep); }
    , ndims = dims.map(function(n) { return commaR(getU(n)); })
    , str = ndims.join(o.joinSep) + ' ' + o.units[exp]
    ;
    return str;
  }

});
