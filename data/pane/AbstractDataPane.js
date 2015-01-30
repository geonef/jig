/**
 * Base class for all data panes
 *
 * A data pane is a widget whose role is to "manage" a model object.
 *
 * It is typically a display, which can embed some editing/action
 * functionnalities.
 *
 * For a pure editor (form), geonef/jig/data/editor/AbstractEditor
 * would better fit (form/validation/saving management).
 *
 * This handles init/load/events around this.object.
 *
 * The DOM is build after 'isDataReady' is resolved, and again at
 * 'onModelChange'. In some cases (when you need the obj to be persisted
 * for example), you may need to do it in afterModelChange() instead:
 * overload these methods, then.
 *
 * @see ./WithControlMixin
 * @todo inherits from ./WithOptionsButtonMixin and remove dedicated code from this class
 */
define([
  "module",
  "dojo/_base/declare",
  "../../_Widget",

  "../../util/async",
  "../../util/widget",
  "../../button/Action",
  "dojo/_base/lang",
  "dojo/_base/window",
  "dojo/dom-class",
  "dojo/on",
  "dojo/topic",
  "../../util/string",

  "geonef/jig/util/dialog",
  "../../button/DropDown",
  "dijit/TooltipDialog",

  "dojo/i18n!../../nls/paneAbstract",
], function(module, declare, _Widget,
            async, widget, Action, lang, window, domClass, on, topic, string,
            dialog, DropDown, TooltipDialog, _) {

  var h = lang.hitch;

  return declare(_Widget, {

    /**
     * The model object - must be given at construction
     *
     * This is not mandatory in some cases. If not provided:
     *       - "enableHoverState" must be set to: false
     *       - "enableClick" must be set to: false
     *
     * @type {geonef/jig/data/model/Abstract}
     */
    object: null,

    /**
     * Properties to fetch
     *
     * @type {Array.<string>}
     */
    autoRequestProps: [],

    /**
     * Is data ready? Set to true once 'autoRequestProps' have been loaded.
     *
     * @type {boolean}
     */
    isDataReady: false,

    /**
     * True to publish "hovering" events on model and subscribe this.setHover to it
     */
    enableHoverState: false,

    enableClick: false,

    /**
     * Whether to enable the duplicate action, in gear DD
     *
     * @type {boolean}
     */
    enableDuplicateAction: false,

    /**
     * Whether to enable the delete action, in gear DD
     *
     * @type {boolean}
     */
    enableDeleteAction: true,

    /**
     * Confirmation question to ask before deleting, set null to diable confirm
     *
     * @type {string}
     */
    removeConfirm: _.action.remove.confirm,

    /**
     * @override
     */
    "class": _Widget.prototype["class"] + " jigDataPane",

    /**
     * @override
     */
    delayedContent: true,

    /**
     * @override
     */
    postMixInProperties: function() {
      this.inherited(arguments);

      this.whenDataReady =
        this.object && this.object.id &&
        (typeof this.autoRequestProps == "string" ||
         this.autoRequestProps.length > 0)

        ? this.object.requestProps(this.autoRequestProps)
        : async.bindArg();
    },

    makeDropDownNode: function(title, cssClass) {
      var _this = this;
      var node = null;
      var options = this.dom(this.makeOptions()).filter(function(o) { return !!o; });

      if (options.length > 0) {
        node = this.dom(
          [DropDown, {
            _attach: 'optionsDD', extraClass: 'icon s24 nolabel gear',
            dropDown: new TooltipDialog({'class': 'jigActionsTooltip jigDataPaneTooltip '+(cssClass || "")}),
            onMouseEnter: h(null, domClass.add, this.domNode, 'overDD'),
            onMouseLeave: h(null, domClass.remove, this.domNode, 'overDD'),
          }]);

        this.dom(
          ['div', { _insert: this.optionsDD.dropDown.containerNode },
           [['h2', {}, title || ""],
            ['div', {'class':'actions'}, options]]]);
      }

      return node;
    },

    makeOptions: function() {
      var nodes = [];

      // if (this.enableDuplicateAction) {
      //   nodes.push([Action, {
      //     label: "Dupliquer",
      //     "class": "item remove",
      //     onExecute: async.deferHitch(this, this.duplicateObject),
      //   }]);
      // }

      if (this.enableDeleteAction) {
        nodes.push([Action, {
          label: _.action.remove.label,
          iconClass: "remove",
          "class": "item remove",
          onExecute: async.deferHitch(this, this.deleteObject),
        }]);
      }

      return nodes;
    },

    /**
     * @override
     */
    postCreate: function() {
      this.inherited(arguments);
      if (this.object) {
        this.own(topic.subscribe(this.object.channel, h(this, this.onModelChannel)));
      }
      if (this.enableClick) {
        this.own(on(this, "click", h(this, this.onObjectClick)));
      }
      if (this.enableHoverState) {
        this.own(
          on(this, "mouseenter", h(this, this.onHoverStateChange, true)),
          on(this, "mouseleave", h(this, this.onHoverStateChange, false))
        );
      }
    },

    /**
     *  @override
     */
    startup: function() {
      if (this._started) { return; }
      this.inherited(arguments);
      this.whenDataReady.then(h(this, function() {
        this.onDataReady();
      }));
    },

    /**
     * Called after model data is ready (props are fetched)
     */
    onDataReady: function() {
      // console.log("onDataReady", this);
      this.isDataReady = true;
      if (this.object) {
        this.onModelChange();
        this.afterModelChange();
      }
    },

    /**
     * Model channel subscriber (registered in 'postCreate')
     *
     * @param {geonef/jig/data/model/Abstract} object
     * @param {string} type
     */
    onModelChannel: function(object, type, state, origin) {
      if (object !== this.object || this._destroyed) { return false; }
      if (type === 'put') {
        this.onModelChange();
      }
      if (type === 'afterPut') {
        this.afterModelChange();
      }
      if (type === 'delete') {
        this.destroy();
      }
      if (this.enableHoverState && type === "hovering") {
        this.setHovering(state);
        return origin !== "pane";
      }
      return false;
    },

    /**
     * Hook - when the model object has changed
     *
     * It should be used by child classed to make custom updates if needed.
     */
    onModelChange: function(saving) {
      // console.log("onModelChange", this, arguments, this.delayedContent);
      if (this.delayedContent === true || this.delayedContent === "onModelChange") {
        this.setupAfterModel();
        this.rebuildDom();
      }
    },

    /** hook */
    setupAfterModel: function() {},

    /**
     * Hook - called on data ready and after changes have been saved
     */
    afterModelChange: function(saving) {
      (this.object.id ? domClass.remove : domClass.add)(this.domNode, "new");
      this.onUrlChange && this.onUrlChange();
      this.onTitleChange && this.onTitleChange();
      if (this.delayedContent === "afterModelChange") {
        this.setupAfterModel();
        this.rebuildDom();
      }
    },

    onObjectClick: function() {
      this.appView.modelPane(this.object).open();
    },

    onHoverStateChange: function(state) {
      this.object.publish(["hovering", state, "pane"]);
    },

    setHovering: function(state) {
      // console.log("setHover text", arguments);
      if (this.hover === state) { return; }
      this.hover = state;
      if (state) {
        domClass.add(this.domNode, 'hover');
      } else {
        domClass.remove(this.domNode, 'hover');
      }
    },

    /** hook */
    onClose: function() {},

    deleteObject: function() {
      var _this = this;

      dialog.confirm({
        confirmLabel: _.action.remove.label,
        cancelLabel: _.action.cancel,
        message: string.substitute(this.removeConfirm, this.object)
      }).then(
        function() {
          return _this.object.store.remove(_this.object);
        },
        function() {
        }
      ).then(async.busy(this.domNode));
    },

    duplicateObject: function() {
      var msg = "Nom de la copie ?";
      var name = window.global.prompt(msg);
      if (!name) { return; }
      var _this = this;
      this.object.store.duplicate(this.object, { properties: { name: name }})
        .then(function(newObj) {
          _this.appView.modelPane(newObj).open();
        })
        .then(async.busy(this.domNode));
    },

    declaredClass: module.id

  });

});
