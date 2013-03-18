/**
 * AMD plugin to load a store for the given model class
 *
 * Use it like this:
 * define(["geonef/jig/data/store!geonef/jig/data/model/User"],
 *        function(userStore) { ... })
 *
 * @see geonef/jig/data/model
 */
define([
  "./model",
  "dojo/_base/lang"
], function(model, lang) {

  return {


    normalize: function(mid, toAbsMid) {
      return (/^\./.test(mid)) ? toAbsMid(mid) : mid;
    },

    load: function(mid, require, load) {
      require([mid], function(Model) {
        var store = model.getStore(Model);
        load(store);
      });
    },

  };

});

