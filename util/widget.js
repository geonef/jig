/**
 * Utilities about widgets
 */
define([
    "dojo/_base/lang",
    "dojo/_base/kernel",
    "dojo/aspect",
    "dojo/on",
    "dijit/_Contained",
    "dijit/registry"
], function(lang, kernel, aspect, on, _Contained, registry) {

    var self = { //--noindent--

        getParent: function(w) {
            return w.getParent ? w.getParent() :
                _Contained.prototype.getParent.call(w);
        },

        /**
         * Return an array of widgets below 'node' which have a 'name' property
         *
         * Made as a separate function to allow child-classes to use it
         * and include widgets outside this' domNode.
         *
         * @param {DOMElement} node
         * @return {Array.<dijit/_Widget>}
         */
        getFirstNamedDescendants: function(node) {
            var widgets = [];
            registry.findWidgets(node).forEach(
                function(w) {
                    if (w.name) {
                        widgets.push(w);
                    } else {
                        self.getFirstNamedDescendants(w.domNode).forEach(
                            function(w2) {
                                widgets.push(w2);
                            });
                    }
                }
            );
            return widgets;
        },

        bubbleSubmit: function(node, event) {
            for (; node && node.parentNode; node = node.parentNode) {
                var widget = registry.byNode(node);
                if (widget) {
                    if (widget.stopBubbleSubmit) {
                        return;
                    }
                    if (typeof widget._onSubmit == "function") {
                        widget._onSubmit(event);
                        break;
                    }
                }
            }
        },

        /**
         * Makes a single-time dojo/connect - OBSOLETE
         *
         * OBSOLETE: since dojo 1.7, this function has been updated to
         *           use dojo/aspect/after (upgrade of dojo/connect) or
         *           dojo/on, if 'obj' has an 'addEventListener' method.
         *
         * This works the same as with dojo/connect, but for once only:
         * the handler is automatically disconnected the first time
         * the method is called.
         *
         * However, the connection can be canceled before the call if needed,
         * simply by calling dojo/disconnect.
         *
         * @param {!Object} obj  Source object for event function
         * @param {string} event Name of event function in obj
         * @param {Object} context Object to bind to the method as "this"
         * @param {function()|string} method Function or method name of context
         * @return {Object} Handler for use with dojo/disconnect.
         */
        connectOnce: function(obj, event, context, method) {
            kernel.deprecated("geonef/jig/util/widget.connectOnce()",
                "use aspect.after() directly");
            var _h;
            var callback = lang.hitch(context, function() {
                _h.remove();
                // dojo/disconnect(_h);
                method.apply(context, arguments);
            });
            if (obj.addEventListener) {
                if (/^on/.test(event)) {
                    event = event.substr(2);
                } else {
                    console.warn("widget.connectOnce: obj has an addEventListener method " +
                        "but event does not start with 'on'", event, obj);
                }
                _h = on(obj, event, callback);
            } else {
                _h = aspect.after(obj, event, callback);
            }
            return _h;
        },

        /**
         * Focus on the given widget
         *
         * @param {dijit/_Widget} widget
         * @return {object}
         */
        focus: function(widget) {
            var parent = registry.getEnclosingWidget(widget.domNode.parentNode);
            if (parent && parent.selectChild) {
                parent.selectChild(widget);
            }
            return widget;
        }
    };

    return self;

});