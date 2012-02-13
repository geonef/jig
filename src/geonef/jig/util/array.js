
dojo.provide('geonef.jig.util.array');

dojo.require('geonef.jig.util');

/**
 * Utility functions dealing with arrays
 */
dojo.mixin(geonef.jig.util.array,
{
  /**
   * Clean an array from falsy values
   *
   * @param {Array} array which won't be modified
   * @return {Array} the cleaned array as a copy
   * @nosideeffects
   */
  cleanArray: function(array) {
    return array.filter(function(v) { return !!v; });
  },

  /**
   * Make a chain-list out of array members
   *
   * It is not circular: the first element has no previous and last has no next.
   * For each element, 'prev' and 'next' properties are defined.
   *
   * @param {Array.<Object>} array whose members must be objects
   * @return {Array.<Object>} same array, with 'prev' and 'next' references
   */
  chainArray: function(array) {
    array.forEach(
      function(obj, key) {
        obj.prev = obj.next = null;
        if (key > 0) {
          obj.prev = array[key - 1];
          obj.prev.next = obj;
        }
      });
    return array;
  }

});
