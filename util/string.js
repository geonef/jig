/**
 * Utility functions dealing with strings
 */
define([
         "dojo/_base/lang",
], function(lang) {

return { //--noindent--

  /**
   * Make the first letter lowercase
   *
   * @param {string} str
   * @return {string}
   * @nosideeffects
   */
  lcFirst: function(str) {
    return str.substr(0, 1).toLowerCase()
      + str.substr(1);
  },

  /**
   * Make the first letter uppercase
   *
   * @param {string} str
   * @return {string}
   * @nosideeffects
   */
  ucFirst: function(str) {
    return str.substr(0, 1).toUpperCase()
      + str.substr(1);
  },

  /**
   * Make sure the string doesn't exceed a limit
   *
   * If it is too long, it is cut with "...".
   *
   * @param {string} str
   * @param {number} maxLength  the limit
   * @return {string}
   * @nosideeffects
   */
  summarize: function(str, maxLength) {
    str = ''+str;
    if (str.length > maxLength) {
      var end = " ...";
      str = str.substr(0, maxLength - end.length) + end;
    }
    return str;
  },

  /**
   * Escape HTML tags (&, <, >, \n)
   *
   * @param {string} content
   * @param {Object} options
   * @return {string}
   * @nosideeffects
   */
  escapeHtml: function(content, options) {
    options = lang.mixin({ disableOnTag: null }, options);
    content = ''+(content || '');
    var escape = !options.disableOnTag ||
      content.indexOf(options.disableOnTag) === -1;
    content = content.replace(options.disableOnTag, '');
    if (escape) {
      content = lang.trim(content)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      if (!options.noBr) {
        content = content.replace(/\n/g, '<br/>');
      }
    }
    return content;
  }

};

});
