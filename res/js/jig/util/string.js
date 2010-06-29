
dojo.provide('jig.util.string');

dojo.mixin(jig.util.string,
{
  lcFirst: function(str) {
    return str.substr(0, 1).toLowerCase()
      + str.substr(1);
  },

  ucFirst: function(str) {
    return str.substr(0, 1).toUpperCase()
      + str.substr(1);
  }

});
