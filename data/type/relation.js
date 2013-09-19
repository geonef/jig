/**
 * Relation types (refOne, embedMany...)
 *
 */
define([
  "module",
  "dojo/_base/lang",
  "dojo/promise/all",
  "../../util/async",
  "../../util/value",
  "../../util/array",
  "../model",
], function(module, lang, whenAll, async, value, array, model) {


  return {

    refMany: {
      fromServer: function(ar, type) {
        if (!(ar instanceof Array)) { return []; }
        return value.getModule(type.targetModel)
          .then(function(_Class) {
            var store = model.getStore(_Class);
            return async.
              whenAll(ar.filter(function(obj) { return !!obj.id; })
                      .map(function(obj, idx) { return store.getLazyObject(obj); }));
          })
          .then(function(objList) {
            if (type.chained) {
              array.chainArray(objList);
            }
            return objList;
          });
      },
      toServer: function(ar, type) {
        if (!(ar instanceof Array)) { return undefined; }
        return ar.map(
          function(obj) {
            if (!obj.id) {
              console.warn("refMany: toServer() will not cascade on new obj:", obj);
            }
            return { id: obj.id };
          });
      }
    },
    refOne: {
      fromServer: function(obj, type) {
        if (obj === null) { return null; }
        return value.getModule(type.targetModel)
          .then(function(_Class) {
            return model.getStore(_Class).getLazyObject(obj);
          });
      },
      toServer: function(obj, type) {
        // do not cascade: foreign objects have to be saved independantly
        if (obj && !obj.id) {
          console.warn("refOne: toServer() will not cascade on new obj:", obj);
        }

        return obj && obj.id ? { id: obj.id } : null;
      }
    },
    embedMany: {
      fromServer: function(ar, type) { // same as 'refMany'
        if (!(ar instanceof Array)) { return []; }
        return value.getModule(type.targetModel)
          .then(function(_Class) {
            var store = model.getStore(_Class);
            return async.
              whenAll(ar.filter(function(obj) { return !!obj.id; })
                      .map(function(obj) { return store.getLazyObject(obj); }));
          })
          .then(function(objList) {
            if (type.chained) {
              array.chainArray(objList);
            }
            return objList;
          });
      },
      toServer: function(ar, type) {
        if (!(ar instanceof Array)) { return undefined; }
        return whenAll(ar.map(function(item) {
          return item.toServerValue({ allValues: true });
        }));
      }
    }

  };

});

