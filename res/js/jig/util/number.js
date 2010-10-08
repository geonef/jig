
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

  /*formatSize: function(bounds) {
    var
      w = bounds.getWidth()
    , h = bounds.getHeight()
    , max = Math.max(w, h)
    , units = [ 'm', 'km' ]
    , mult = 1000
    , preci = 0.1
    , logNp = function(x, base) { return Math.max(0, Math.floor(Math.log(x) / Math.log(base))); }
    , exp = Math.min(logNp(max, mult), units.length - 1)
    , getU = function(x) { return Math.round((x / Math.pow(mult, exp)) * (1 / preci)) / (1 / preci); }
    , commaR = function(s) { return (''+s).replace(/\./, ','); }
    , nw = commaR(getU(w))
    , nh = commaR(getU(h))
    , str = nw + ' x ' + nh + ' ' + units[exp]
    ;
    return str;
  }*/

});
