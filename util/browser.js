/**
 * Browser functionnalities utils, espacially HTML 5 APIs (fullscreen, etc.)
 */
define([
  "dojo/_base/lang",
  "dojo/_base/window",
  "dojo/on"
], function(lang, window, on) {

  var self = {

    isFullscreenSupported: function() {
      var node = window.doc.documentElement;
      return node.requestFullscreen || node.mozRequestFullScreen || node.webkitRequestFullscreen;

    },

    isFullscreenEnabled: function() {
      var doc = window.doc;
      return !!(doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement);
    },

    requestFullscreen: function(node) {
      if (node.requestFullscreen) {
        node.requestFullscreen();
      } else if (node.mozRequestFullScreen) {
        node.mozRequestFullScreen();
      } else if (node.webkitRequestFullscreen) {
        node.webkitRequestFullscreen();
      }
    },

    cancelFullscreen: function() {
      var doc = window.doc;
      if (doc.cancelFullscreen) {
        doc.cancelFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.webkitCancelFullScreen) {
        doc.webkitCancelFullScreen();
      }
    },

    /**
     * @return Array
     */
    onFullscreenChange: function(handler) {
      return  [
        "fullscreenchange", "mozfullscreenchange", "webkitfullscreenchange",
        "fullscreenerror", "mozfullscreenerror", "webkitfullscreenerror"
      ].map(function(eventName) {
        return on(window.doc, eventName, lang.hitch(null, handler, eventName));
      });
    },


  };

  return self;

});
