/**
 * Various utilities about JS values
 */
define([
         "dojo/_base/lang",
], function(lang) {

var self = { //--noindent--

  /**
   * Get given class, fetch it if needed
   *
   * @param {!string|Function} name  the name of the class, or the class itself
   * @param {boolean} require   if false, the class won't be fetched if not available
   * @return {?Function} the class matching 'name', or null of 'require' is true and the class isn't available
   */
  getClass: function(name, requireIt) {
    if (typeof name == 'function') {
      return name;
    }
    var Class = lang.getObject(name);
    if (typeof Class != 'function') {
      requireIt = requireIt === undefined || requireIt;
      //console.log('loading class', name, requireIt);
      if (requireIt) {
        // require(name);
        dojo['require'](name);
      }
      Class = lang.getObject(name);
    }
    if (typeof Class != 'function') {
      console.error(name, 'is not a class!', Class, arguments);
      throw new Error(name+' is not a class!');
    }
    return Class;
  },


  /**
   * Compare 2 values recursively until scalar values
   *
   * The comparison is strict on scalar values.
   * Array items and object properties are checked recursively.
   *
   * @param {mixed} value1
   * @param {mixed} value2
   * @return {boolean}
   */
  isSame: function(value1, value2) {
    if (typeof value1 !== typeof value2) { return false; }

    if ((value1 === null && value2 !== null) ||
        (value1 !== null && value2 === null)) { return false; }
    // because: (typeof null === 'object') !

    if (value1 instanceof Array) {
      if (value1.length !== value2.length) {
        return false;
      }
      return value1.every(
        function(item, key) {
          return self.isSame(item, value2[key]);
        });
    }

    if (typeof value1 == 'object' && typeof value2 == 'object') {
      var _p = [], key;
      for (key in value1) if (value1.hasOwnProperty(key)) {
        if (!self.isSame(value1[key], value2[key])) {
          return false;
        }
        _p.push(key);
      }
      for (key in value2) if (value2.hasOwnProperty(key)) {
        if (_p.indexOf(key) === -1) {
          return false;
        }
      }
      return true;
    }

    return value1 === value2;
  },

};

return self;

});
