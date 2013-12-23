/**
 * Make a DOM element using the specified structure
 *
 * Args is an array like [tagName, attributeObj, content].
 * "content" is optionnal, can be another args, or an array of args.
 *
 * This way, whole DOM trees can be specified at once.
 *
 * Attributes are defined in args[1] ; the following magic
 * attributes are supported:
 *
 *   - '_attach' {string}
 *            will attach the node to the provided obj
 *            as the key whose name is the value of that
 *            '_attachPoint' property.
 *            For widgets, the widget itself is attached, not the node.
 *
 *   - '_insert' {HTMLElement}
 *            automatically add the created node as a child to the
 *            provided element
 *
 *   - '_tooltip' {string}
 *            Automatically create a dijit/Tooltip widget for the node,
 *            with the given string as its label
 *
 *   - '_tooltipOptions' {object}
 *            Optional object of tooltip options
 *            (typically for 'showDelay' and 'position')
 *
 *   - '_srcNodeName' {string}
 *            For widgets only:
 *            create an element of the given name (ex: 'div', 'span')
 *            then add all children and pass it as the srcNode of
 *            the created widget at instanciation.
 *
 *   - '_if' {boolean|dojo/Deferred}
 *            If the given value is falsy, the node construction
 *            is skipped, which means makeDOM returns null.
 *            If a deferred is provided, makeDOM will return a deferred
 *            itself which will be resolved with :
 *                    - null if the '_if' deferred resolved to null
 *                    - the created node, in the other case
 *
 *   - '_ifNot' {boolean|dojo/Deferred}
 *            Opposite from '_if', apply the value if true.
 *            Useful when using deferreds. Can't be used together with '_if'.
 *
 *   - '_style' {object}
 *            Assemble a string "style" property from given _style object (helper)
 *
 * Special features:
 *
 *   - if a widget is provided instead of tagName, its domNode is used
 *
 *   - makeDOM() can be called with an array of node defs : in that case,
 *     an array of DOMElement is returned
 *
 * @param {Array}             args
 * @param {?Object}           obj
 * @return {?DOMElement|dojo/Deferred}
 */
define([
  "dojo/_base/lang",
  "dojo/dom-construct",
  "dijit/_Widget",
  "dijit/Tooltip",
], function(lang, construct, _Widget, Tooltip) {

  function addChildTo(node, childNode) {

    if (!childNode) {
      return null;
    }

    var _do =
      function(childNode) {
        if (childNode) {
          node.appendChild(childNode);
        }
        return childNode;
      };

    if (childNode.then) {
      return childNode.then(_do);
    }

    return _do(childNode);
  }

  function addChildren(children, node, obj) {

    var addChild = lang.hitch(null, addChildTo, node);


    if (children) {
      var child = children;
        if (child instanceof Array) {
          if (typeof child[0] == 'string' || typeof child[0] == 'function') {
            // child is an args array for makeDOM
            var childNode = self(child, obj);
            addChild(childNode);
          } else {
            // assume child is an array of args
            child.map(function(c) { return self(c, obj); })
              .forEach(addChild);
          }
        } else if (child instanceof HTMLElement || child.then) {
          addChild(child);
        } else {
          // scalar content value - set as text
          node.innerHTML = child;
        }
    }
  }

  /**
   * Main module function
   */
  function self(args, obj) {
    // console.log('makeDOM args=', args);
    obj = obj || {};
    var node;

    if (!args) { return null; }
    if (args instanceof HTMLElement || args.domNode) {
      return args;
    }
    if (args.then) {
      return args.then(function(def) { return self(def, obj); });
    }
    if (!(args instanceof Array)) {
      console.error("args is: ", args);
      throw new Error("makeDOM: args is not an array not promise or a DOM element");
    }
    if (!args.length) {
      return [];
    }
    if (!args[0]) {
      console.error("obj is: ", obj, " and args are: ", args);
      throw new Error("makeDOM: args[0] is null: undeclared widget class?");
    }
    if (args[0] && ['string', 'function'].indexOf(typeof args[0]) === -1) {
      // if args[0] is neither of string, function or falsy: assume node-array mode
      // todo: manage async
      return args.map(function(def) { return self(def, obj); });
    }
    // if (args[0] instanceof Array || args[0].then) {
    //   return args.map(function(def) { return self(def, obj); });
    // }
    // if (args[0] instanceof _Widget) {
    //   return args[0].domNode;
    // }
    // if (args[0] instanceof HTMLElement) {
    //     return args[0];
    // }
    var attrs = lang.mixin({}, args[1]);
    var magic = {};
    ['_attach', '_insert', '_tooltip', '_tooltipOptions',
     '_srcNodeName', '_if', '_ifNot', '_style'].forEach(
       function(attr) {
         if (attrs[attr] !== undefined) {
           magic[attr] = attrs[attr];
           delete attrs[attr];
         }
       });
    if (magic._if !== undefined) {
      if (!magic._if) { return null; }
      if (magic._if.then) {
        return magic._if.then(
          function(ret) {
            if (!ret) { return null; }

            var _args = args.slice(0);
            _args[1] = lang.mixin({}, _args[1]);
            delete _args[1]._ifNot;

            return self(_args, obj);
          });
      }
    }
    if (magic._ifNot) {
      if (magic._ifNot.then) {
        return magic._ifNot.then(
          function(ret) {
            if (ret) { return null; }

            var _args = args.slice(0);
            _args[1] = lang.mixin({}, _args[1]);
            delete _args[1]._ifNot;

            return self(_args, obj);
          });
      }
      return null;
    }
    if (magic._style) {
      attrs.style = Object.keys(magic._style)
        .map(function(key) { return key+":"+magic._style[key]; }).join(";");
    }
    if (typeof args[0] == 'function') { // assume widget class
      var _Class = args[0];
      var srcNode = null;
      if (magic._srcNodeName) {
        srcNode = self([magic._srcNodeName, {}, args[2]], obj);
      }
      var widget = new _Class(lang.mixin(attrs, obj && obj.domWidgetProps), srcNode);
      if (obj.domWidgets) {
        obj.domWidgets.push(widget);
      }
      if (magic._attach) {
        obj[magic._attach] = widget;
      }
      if (!magic._srcNodeName) {
        addChildren(args[2], widget.containerNode, obj);
      }
      if (obj._started) {
        widget.startup();
      }
      // console.log('made widget', widget, node);
      node = widget.domNode;
    } else if (!args[0]) {
      console.error("obj is: ", obj, " and args are: ", args);
      throw new Error("makeDOM: args[0] is null: undeclared widget class?");
    } else { // assume string - node name of DOMElement to create
      node = construct.create(args[0], attrs);
      addChildren(args[2], node, obj);
      if (magic._attach) {
        obj[magic._attach] = node;
      }
    }
    if (magic._insert) {
      magic._insert.appendChild(node);
    }
    if (magic._tooltip) {
      var tooltip = new Tooltip(
        lang.mixin({ label: magic._tooltip, connectId: [node],
                     showDelay: 200, position: ['below', 'above']
                   }, magic._tooltipOptions));
      if (obj.domWidgets) {
        obj.domWidgets.push(tooltip);
      }
    }

    // console.log('makeDOM', args, 'returning', node);

    return node;
  }

  return self;
});

