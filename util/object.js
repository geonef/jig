define([
         "dojo/_base/lang",
], function(lang) {

var h = lang.hitch;

var self = {

  /**
   * Transform object properties to array items
   *
   * @param {Object} obj Object to process
   * @return {Array}
   */
  toArray: function(obj) {
    var arr = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        arr.push(obj[key]);
      }
    }

    return arr;
  },

  /**
   * Same as dojo.map, but also works with objects.
   *
   * If an array is given, it's the same than dojo.map.
   *
   * The callback function is called with the following arguments:
   *          - the value of the current property
   *          - the key of the current property
   *          - the entire source object
   *
   * @param {!Object|Array} obj object or array to iterate on
   * @param {function(*, string|number, !Object|Array)} func callback function
   * @param {Object=} thisObj object to bind to callback function as "this"
   * @return {Object}
   */
  map: function(obj, func, thisObj) {
    if (obj instanceof Array) {
      return obj.map(func, thisObj);
    }
    var newObj = {};
    func = h(thisObj, func);
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = func(obj[key], key, obj);
      }
    }
    return newObj;
  },

  /**
   * Same as dojo.filter, but also works with objects.
   *
   * If an array is given, it's the same than dojo.filter.
   *
   * If an object is given, the callback function is called for each value
   * of the object. The returned object contains the values where
   * the callback has returned true.
   * The callback function is called with the following arguments:
   *          - the value of the current property
   *          - the key of the current property
   *          - the entire source object
   *
   * @param {!Object|Array} obj object or array to iterate on
   * @param {function(*, string|number, Object|Array): boolean} func callback function
   * @param {Object=} thisObj object to bind to callback function as "this"
   */
  filter: function(obj, func, thisObj) {
    if (obj instanceof Array) {
      return obj.filter(func, thisObj);
    }
    var newObj = {};
    func = h(thisObj, func);
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (!!func(obj[key], key, obj)) {
          newObj[key] = obj[key];
        }
      }
    }
    return newObj;
  },

  // we should have a different name for working on objects
  // (to avoid confusion between objects and arrays)
  // dojox.lang.functional
  // dojox.lang.functional.forIn
  // http://dojo-toolkit.33424.n3.nabble.com/For-in-helpers-td812651.html
  // http://mail.dojotoolkit.org/pipermail/dojo-interest/2010-May/046043.html

  /**
   * Same as dojo.forEach, but also works with objects.
   *
   * If an array is given, it's the same than dojo.forEach.
   *
   * If an object is given, iterates over its properties.
   * In that situation, the given function is called with
   * the following arguments:
   *          - the value of the current property
   *          - the key of the current property
   *          - the entire source object
   *
   * @param {!Object|Array} obj object or array to iterate on
   * @param {function(*, string|number, Object|Array)} func callback function
   * @param {Object=} thisObj object to bind to callback function as "this"
   */
  forEach: function(obj, func, thisObj) {
    if (obj instanceof Array) {
      return obj.forEach(func, thisObj);
    }
    func = h(thisObj, func);
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        func(obj[key], key, obj);
      }
    }
    return obj;
  },

  /**
   * Same as dojo.indexOf, but also works with objects
   *
   * If an array is given, it's the same than dojo.indexOf.
   *
   * If an object is given, it's (own) properties are iterated
   * until the value is found. The matching key is returned.
   * If the value is not found, the function returns -1.
   *
   * @param {!Object|Array} haystack object or array to search
   * @param {!*}            needle   value to search for
   */
  indexOf: function(haystack, needle) {
    if (haystack instanceof Array) {
      return obj.indexOf(needle);
    }
    for (var i in haystack) {
      if (haystack.hasOwnProperty(i) && haystack[i] === needle) {
        return i;
      }
    }
    return -1;
  },

};

return self;

});
