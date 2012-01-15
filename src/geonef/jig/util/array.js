
dojo.provide('geonef.jig.util.array');

dojo.require('geonef.jig.util');

dojo.mixin(geonef.jig.util.array,
{
  clean: function(array) {
    return array.filter(function(v) { return !!v; });
  }

});
