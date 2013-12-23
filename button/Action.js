/**
 * Simple link, same kind as <a> but very flexible.
 *
 * Any HTML node can be specified (or given as srcNode), the action
 * can be a real "href" or channel publishing, and/or widget instanciation.
 *
 * At some point, it should replace geonef/jig/button/Action as well,
 * providing a simpler implementation & DOM structure.
 *
 */
define([
  "module",
  "dojo/_base/declare",
  "dijit/_Widget",

  "../util/widget",
  "../util/async",

  "dojo/_base/event",
  "dojo/_base/window",
  "dojo/topic",
  "dojo/dom-construct",
  "dojo/dom-class",
  "dojo/_base/array",
  "dojo/_base/lang",
], function(module, declare, _Widget,
            widget, async,
            event, window, topic, construct, domClass, array, lang) {

return declare(_Widget, { //--noindent--

  /**
   * Link label, HTML supported (innerHTML)
   *
   * @type {string}
   */
  label: '',

  /**
   * Content of 'title' tooltip
   *
   * @type {string}
   */
  title: '',

  /**
   * If set, onExecute will (dojo.)publish a message on the given channel
   *
   * @type {string}
   */
  publish: '',

  /**
   * CSS classes to be set on domNode
   *
   * @type {string} class
   */
  "class": "button",

  /**
   * Additional CSS classes to set (obsolete - use 'extraClass' instead)
   *
   * @type {string}
   */
  cssClasses: '',

  /**
   * If set, a confirmation is asked on mouseClick before calling onExecute
   */
  confirm: '',

  /**
   * Name of element to create, unless one of 'srcNodeRef' or 'href' is provided
   *
   * @type {string}
   */
  nodeName: 'span',

  /**
   * If provided, an <a> element is created rather than <span>
   * (whatever is the value of 'nodeName')
   *
   * @type {string}
   */
  href: '',

  target: '',

  /**
   * If true, onExecute() is called on a deferred loop
   */
  deferExecute: false,

  /**
   * If true, do not bubble up the execute() event
   *
   * It's a kind of "submit", for example it would automatically close
   * a dialog or tooltip dialog.
   *
   * @type {boolean}
   */
  noSubmit: false,

  /**
   * If true, the submit is made after the call to onExecute(),
   * unless the return value is false
   *
   * @type {boolean}
   */
  lateSubmit: false,

  connectA: true,

  buildRendering: function() {
    if (this.srcNodeRef) {
      this.domNode = construct.create(this.srcNodeRef.nodeName);
      array.forEach(this.srcNodeRef.childNodes,
                    function(node) { this.domNode.appendChild(node); }, this);
    } else {
      if (this.href) {
        this.domNode = construct.create('a', { href: this.href });
      } else {
        this.domNode = construct.create(this.nodeName, {});
      }
    }
    domClass.add(this.domNode, this["class"]+" "+(this.extraClass||"") + " " + this.cssClasses);
    if (this.domNode.nodeName !== 'A' || this.connectA) {
      this.connect(this.domNode, 'onclick', 'onClick');
    }
    this.domNode.innerHTML = "&nbsp;";
  },

  _setLabelAttr: function(label) {
    this.label = label;
    if (label) {
      label = domClass.contains(this.domNode, "important") ?
        label.toUpperCase() : label;
    } else {
      label = "&nbsp;";
    }
    this.domNode.innerHTML = label;
  },

  _setTitleAttr: function(title) {
    this.title = title;
    this.domNode.title = title;
  },

  _setHrefAttr: function(href) {
    this.href = href;
    this.domNode.href = href;
  },

  _setTargetAttr: function(target) {
    this.target = target;
    this.domNode.target = target;
  },

  _setDisabledAttr: function(state) {
    this.disabled = state;
    (state ? domClass.add : domClass.remove)(this.domNode, 'disabled');
  },


  onClick: function(evt) {
    if (this.domNode.nodeName === 'A') {
      if (this.disabled) {
        event.stop(evt);
      }
      return;
    }
    event.stop(evt);
    if (this.disabled) { return; }
    var execute = lang.hitch(this, this.execute, evt);
    if (!this.confirm ||
        window.global.confirm(this.confirm)) {
      if (this.deferExecute) {
        async.whenTimeout(0).then(execute);
      } else {
        execute();
      }
    }
  },

  execute: function(evt) {
    var ret;
    if (this.lateSubmit) {
      ret = this.onExecute();
    }
    if (ret !== false && !this.noSubmit) {
      widget.bubbleSubmit(this.domNode, evt);
    }
    if (!this.lateSubmit) {
      this.onExecute();
    }
    if (this.publish) {
      topic.publish(this.publish);
    }
  },

  /**
   * Hook
   */
  onExecute: function() {},

  _setEmphasizeAttr: function(state) {
    (state ? domClass.add : domClass.remove)(this.domNode, 'emphasize');
  },

  declaredClass: module.id

});

});
