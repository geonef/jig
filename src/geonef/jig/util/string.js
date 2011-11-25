
dojo.provide('geonef.jig.util.string');

dojo.require('geonef.jig.util');

dojo.mixin(geonef.jig.util.string,
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
    str = ''+str;
    if (str.length > maxLength) {
      var end = " ...";
      str = str.substr(0, maxLength - end.length) + end;
    }
    return str;
  },

  escapeHtml: function(content, options) {
    options = dojo.mixin({ disableOnTag: null }, options);
    if (!dojo.isString(content)) {
      content = '';
    }
    var escape = !options.disableOnTag ||
      content.indexOf(options.disableOnTag) === -1;
    content = content.replace(options.disableOnTag, '');
    if (escape) {
      content = dojo.trim(content)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');
    }
    return content;
  }

});
