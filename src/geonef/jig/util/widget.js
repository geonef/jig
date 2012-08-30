define([
         "dojo/_base/lang",
         "dojo/aspect",
         "dojo/on",
         "dijit/_Contained",
         "../widget/Processing",
         "dijit/registry"
], function(lang, aspect, on, _Contained, Processing, registry) {


var self = {

  //  Unused
  //
  // getParent: function(w) {
  //   return w.getParent ? w.getParent() :
  //      dijit._Contained.prototype.getParent.call(w);
  // },

  /**
   * Return an array of widgets below 'node' which have a 'name' property
   *
   * Made as a separate function to allow child-classes to use it
   * and include widgets outside this' domNode.
   *
   * @param {DOMElement} node
   * @return {Array.<dijit._Widget>}
   */
  getFirstNamedDescendants: function(node) {
    var widgets = [];
    registry.findWidgets(node).forEach(
      function(w) {
        if (w.name) {
          widgets.push(w);
        } else {
          self.getFirstNamedDescendants(w.domNode).forEach(
            function(w2) { widgets.push(w2); });
        }
      }
    );
    return widgets;
  },

  /**
   * Create busy effect on node until returned function is called
   *
   * Example:
   *     deferred.then(geonef.jig.util.busy(node))
   *
   * @param {DOMElement} node
   * @return {function} must be called to stop the busy effect
   */
  busy: function(node) {
    var control = new Processing({ processingNode: node });
    control.startup();
    return function(arg) {
      control.end();
      return arg;
    };
  },

  bubbleSubmit: function(node, event) {
    for (; node && node.parentNode; node = node.parentNode){
      var widget = registry.byNode(node);
      if (widget && typeof widget._onSubmit == "function") {
	widget._onSubmit(event);
	break;
      }
    }
  },

  /**
   * Makes a single-time dojo.connect - OBSOLETE
   *
   * Warning: since dojo 1.7, this function has been update to
   *          use dojo.aspect.after (upgrade of dojo.connect) or
   *          dojo.on, if 'obj' is an 'addEventListener' method.
   *
   * This works the same as with dojo.connect, but for once only:
   * the handler is automatically disconnected the first time
   * the method is called.
   *
   * However, the connection can be canceled before the call if needed,
   * simply by calling dojo.disconnect.
   *
   * @param {!Object} obj  Source object for event function
   * @param {string} event Name of event function in obj
   * @param {Object} context Object to bind to the method as "this"
   * @param {function()|string} method Function or method name of context
   * @return {Object} Handler for use with dojo.disconnect.
   */
  connectOnce: function(obj, event, context, method) {
    var _h;
    var callback = lang.hitch(context, function() {
                   _h.remove();
                   // dojo.disconnect(_h);
                   method.apply(context, arguments);
                 });
    if (obj.addEventListener) {
      if (/^on/.test(event)) {
        event = event.substr(2);
      } else {
        console.warn("jig.connectOnce: obj has an addEventListener method "
                     + "but event does not start with 'on'", event, obj);
      }
      _h = on(obj, event, callback);
    } else {
      _h = aspect.after(obj, event, callback);
    }
    return _h;
  },

};

return self;

});
