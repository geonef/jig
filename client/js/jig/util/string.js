
dojo.provide('jig.util.string');

dojo.require('jig.util');

dojo.mixin(jig.util.string,
{
  lcFirst: function(str) {
    return str.substr(0, 1).toLowerCase()
      + str.substr(1);
  },

  ucFirst: function(str) {
    return str.substr(0, 1).toUpperCase()
      + str.substr(1);
  },

  summarize: function(str, maxLength) {
    if (str.length > maxLength) {
      var end = " ...";
      str = str.substr(0, maxLength - end.length) + end;
    }
    return str;
  }

});
