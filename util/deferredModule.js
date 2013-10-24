/**
 * AMD plugin for lazy-loading a module
 *
 * Use it in your deps array like :
 *   define(["geonef/jig/util/deferredModule!my/lazy/Module"],
 *          function(refModule) {
 *              refModule.load().then(function(Module) { ... });
 *          });
 *
 * Also compatible with geonef/jig/util/value.getModule().
 */
define([
  "require",
  "dojo/Deferred",
  "dojo/has"
], function(require, Deferred, has) {

  function deferredModule(mid, localRequire) {

    return {

      mid: mid,

      load: function() {
        var deferred = new Deferred();
        if (has("geonef-debug-loading")) {
          console.info("deferredModule: loading", mid);
        }
        (localRequire || require)([mid], function(Module) {
          deferred.resolve(Module);
        });
        return deferred;
      }

    };
  }


  /*******************************************************************
   ** AMD plugin
   **/

  deferredModule.normalize = function(mid, toAbsMid) {
    return (/^\./.test(mid)) ? toAbsMid(mid) : mid;
  };

  deferredModule.load = function(mid, require, load) {
    load(deferredModule(mid, require));
  };


  return deferredModule;

});
