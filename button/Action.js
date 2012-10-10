define([
  "dojo/_base/declare",
  "dijit/_Widget",

  "../util/widget",
  "dojo/_base/event",
  "dojo/topic",
  "dojo/dom-construct",
  "dojo/dom-class",
  "dojo/_base/array"
], function(declare, _Widget,
            widget, event, topic, construct, domClass, array) {


/**
 * Simple link, same kind as <a> but very flexible.
 *
 * Any HTML node can be specified (or given as srcNode), the action
 * can be a real "href" or channel publishing, and/or widget instanciation.
 *
 * At some point, it should replace geonef.jig.button.Action as well,
 * providing a simpler implementation & DOM structure.
 */
return declare('geonef.jig.button.Link', _Widget,
{ //--indent after--

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
   * Additional CSS classes to set
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
   * If provided (and 'href' is not), that class is instanciated
   * and auto-anchored automatically when the link is clicked.
   *
   * @type {string} name of class to load & instanciate
   */
  autoInstanciate: '',


  buildRendering: function() {
    //console.log('buildRendering', this, arguments);
    if (this.srcNodeRef) {
      this.domNode = construct.create(this.srcNodeRef.nodeName);
      array.forEach(this.srcNodeRef.childNodes,
                    function(node) { this.domNode.appendChild(node); }, this);
    } else {
      if (this.href) {
        this.domNode = construct.create('a', { href: this.href });
      } else {
        this.domNode = construct.create(this.nodeName);
      }
    }
    if (this.label) {
      this.domNode.innerHTML = this.label;
    }
    domClass.add(this.domNode, 'link '+this.cssClasses);
    if (this.domNode.nodeName !== 'A') {
      this.connect(this.domNode, 'onclick', 'onClick');
    }
  },

  _setLabelAttr: function(label) {
    this.label = label;
    if (label) {
      this.domNode.innerHTML = label;
    }
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
    event.stop(evt);
    if (this.disabled) { return; }
    if (!this.confirm ||
        window.global.confirm(this.confirm)) {
      this.execute(evt);
    }
  },

  execute: function(evt) {
    var ret = this.onExecute();
    if (ret !== false && !this.noSubmit) {
      widget.bubbleSubmit(this.domNode, evt);
    }
    if (this.publish) {
      topic.publish(this.publish);
    }
  },

  onExecute: function() {
    if (this.autoInstanciate) {
      require("geonef/jig/workspace").autoAnchorInstanciate(this.autoInstanciate);
    }
  },

  _setEmphasizeAttr: function(state) {
    (state ? domClass.add : domClass.remove)(this.domNode, 'emphasize');
  }

});

});
