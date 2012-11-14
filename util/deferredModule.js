define([
  "require",
  "dojo/Deferred"
], function(require, Deferred) {

  function deferredModule(mid, localRequire) {

    return {

      mid: mid,

      load: function() {
        var deferred = new Deferred();
        (localRequire || require)([mid], function(Module) {
          deferred.resolve(Module);
        });
        return deferred;
      }

    };
  }

  deferredModule.normalize = function(mid, toAbsMid) {
    return (/^\./.test(mid)) ? toAbsMid(mid) : mid;
  };

  deferredModule.load = function(mid, require, load) {
    load(deferredModule(mid, require));
  };


  return deferredModule;

});
