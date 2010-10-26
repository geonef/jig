
dojo.provide('jig.util.number');

dojo.require('jig.util');

dojo.mixin(jig.util.number,
{
  /*formatNumber: function(number) {
    var
      units = [ 'm', 'km' ]
    , mult = 1000
    , preci = 0.1
    , logNp = function(x, base) { return Math.max(0, Math.floor(Math.log(x) / Math.log(base))); }
    , exp = Math.min(logNp(number, mult), units.length - 1)
    , getU = function(x) { return Math.round((x / Math.pow(mult, exp)) * (1 / preci)) / (1 / preci); }
    , commaR = function(s) { return (''+s).replace(/\./, ','); }
    , nw = commaR(getU(w))
    , nh = commaR(getU(h))
    , str = nw + ' x ' + nh + ' ' + units[exp]
    ;
    return str;
  }*/

  formatDims: function(dims, options) {
    // summary: format an array of numbers (called "dimensions")
    //
    //      Can typically work on 2D or 3D coordinates, sizes...
    //      Can also work on simple numbers (call: formatDims([number]))
    //
    // dims: array
    //      Array of float numbers so that dims.length >= 1
    //
    // options: object
    //      Used to override default options. Options are:
    //          mult: exp base between units
    //          units: array
    //                  string array specifying the unit names in powers
    //                  of "options.mult".
    //          preci: float
    //                  precision for decimal part
    //          joinSep: string
    //                  separator for numbers serialization (join)
    //
    //      Specify options.mult for no-SI units (ex: KiB, MiB use 1024)
    //
    // Examples:
    //      formatDims([fileWeight], { mult: 1024,
    //                                 units: ['B', 'KiB', 'MiB', 'GiB' ]})
    //      formatDims([width, height], { units ['m', 'km'] })
    //
    var o = dojo.mixin(
      {
        units: [ '', 'K', 'M' ],
        mult: 1000,
        preci: 0.1,
        joinSep: ', '
      }, options);
    var
      max = Math.max.apply(null, dims)
    , logNp = function(x, base) {
                return Math.max(0, Math.floor(Math.log(x) / Math.log(base))); }
    , exp = Math.min(logNp(max, o.mult), o.units.length - 1)
    , getU = function(x) { return Math.round((x / Math.pow(o.mult, exp)) *
                                             (1 / o.preci)) / (1 / o.preci); }
    , commaR = function(s) { return (''+s).replace(/\./, ','); }
    , ndims = dims.map(function(n) { return commaR(getU(n)); })
    , str = ndims.join(o.joinSep) + ' ' + o.units[exp]
    ;
    return str;
  }

});
