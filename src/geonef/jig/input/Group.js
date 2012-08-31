define([
         "dojo/_base/declare",
         "../_Widget",
         "./_Container",

         "dojo/dom-construct",
         "dojo/_base/event",

], function(declare, _Widget, _Container,
            construct, event) {

/**
 * Dumb widget extending geonef.jig.input._Container
 *
 * - use this class when an input group is needed as a widget
 * - use _Container when the functionality can be used as part
 *   of an existing widget's logic.
 *
 * @see geonef.jig.input._Container
 */
return declare('geonef.jig.input.Group', [ _Widget, _Container ],
{

  nodeName: 'div',
  'class': '',

  autocomplete: true,

  buildRendering: function() {
    this.inherited(arguments);

    this.containerNode = this.domNode;
    this.copySrcNodeChildren();

    if (this.domNode.nodeName == 'FORM') {
      this.domNode.action = '#';
      this.domNode.name = this.id;
      this.domNode.setAttribute('autocomplete', this.autocomplete ? 'on' : 'off');
      var _this = this;
      this._onSubmit = function() {
        // would be called by geonef.jig.util.bubbleSubmit
        // console.log('Group _onSubmit', this, arguments);
        _this.submit();
        // _this.domNode.submit();
      };
      this.connect(this.domNode, 'onsubmit', this.onFormSubmit);
    }
  },

  submit: function() {
    // console.log('submit', this, arguments);
    var sb = construct.create('input', { type: 'submit', style: 'display:none' }, this.domNode);
    sb.click();
    construct.destroy(sb);
  },

  onFormSubmit: function(event) {
    // console.log('Group onFormSubmit', this, arguments);
    event.stop(event);
    this.onExecute();

    return false;
  },

  onExecute: function() {
  }

});

});
