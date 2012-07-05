dojo.provide('geonef.jig.input.Group');

dojo.require('geonef.jig._Widget');
dojo.require('geonef.jig.input._Container');

dojo.declare('geonef.jig.input.Group',
		[ geonef.jig._Widget, geonef.jig.input._Container ],
{

  nodeName: 'div',
  'class': '',

  autocomplete: true,

  buildRendering: function() {
    this.inherited(arguments);

    this.containerNode = this.domNode;

    if (this.domNode.nodeName == 'FORM') {
      this.domNode.action = '#';
      this.domNode.name = this.id;
      this.domNode.setAttribute('autocomplete', this.autocomplete ? 'on' : 'off');
      var _this = this;
      this._onSubmit = function() {
        // would be called by geonef.jig.util.bubbleSubmit
        console.log('Group _onSubmit', this, arguments);
        _this.submit();
        // _this.domNode.submit();
      };
      this.connect(this.domNode, 'onsubmit', this.onFormSubmit);
    }
  },

  submit: function() {
    console.log('submit', this, arguments);
    var sb = dojo.create('input', { type: 'submit', style: 'display:none' }, this.domNode);
    sb.click();
    dojo.destroy(sb);
  },

  onFormSubmit: function(event) {
    console.log('Group onFormSubmit', this, arguments);
    dojo.stopEvent(event);
    this.onExecute();

    return false;
  },

  onExecute: function() {
  }

});
