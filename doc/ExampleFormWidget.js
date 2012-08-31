define([
         "dojo/_base/declare",
         "geonef/jig/_Widget",
         "geonef/jig/input/_Container",

         "geonef/jig/input/Group",
         "geonef/jig/input/TextBox",
         "dijit/form/Button",
         "dijit/form/NumberSpinner",
         "dijit/form/Select",

         "dojo/_base/lang",
         "geonef/jig/api"
], function(declare, _Widget, _Container,
            TextBox, Button, NumberSpinner, Select,
            lang, api) {


/**
 * This is a double example.
 *
 * Because of geonef/jig/_Widget, we can express the DOM through makeContentNodes
 *
 * Because of _Container, this class behaves like a Group:
 *   this.get("value"), this.set("value"), this.validate(), this.isValid()
 */
return declare([_Widget, _Container],
{
  /**
   * @override
   */
  'class': _Widget.prototype['class'] + ' someCssClass',


  /**
   * The makeContentNodes method is define in _Widget and is supposed to
   * return an array of nodes. That array will be processed through util.makeDOM.
   *
   * All widgets created there will be destroyed automatically
   * at this.destroyRendering().
   */
  makeContentNodes: function() {
    return [
      ['h2', {'class':'top'}, "My widget title"],
      ['p', {'class':'intro'}, "Some introduction text"],
      ['div', {}, [
         [TextBox, { name: "surname" }],
         [NumberSpinner, { name: "age", _attach: "ageInput" }], // widget will be attached as this.ageInput
         [Group, { name: "work" }, [
            [TextBox, { name: "company" }]
            [Select, {
               name: "type",
               options: [
                 { value: "dev", label: "Developer" },
                 { value: "manager", label: "Manager" },
                 { value: "tester", label: "Tester" },
               ]
             }]
            // Here we could nest another group in this group (no limit)
          ]]
       ]]
      ['div', {}, [
         [Button, {
            label: "OK",
            onClick: lang.hitch(this, this.actionOK)
          }],
         [Button, {
            label: "Cancel",
            onClick: lang.hitch(this, this.actionCancel)
          }],
       ]],
    ];
  },

  /**
   * Let's set some initial value to the form
   */
  postCreate: function() {
    this.set('value', {
               surname: "Bob",
               age: 42,
               work: {
                 company: "Geonef",
                 type: "dev"
               }
             });

    this.ageInput.set("disabled", true); // example

    this.inherited(arguments);
  },

  /**
   * When OK is clicked, we validate the form, get the value
   * and send it through the API
   */
  actionOK: function() {
    if (!this.validate()) {
      return;
    }

    var data = this.get('value');
    api.request(lang.mixin({ action: 'saveProps' }, data))
      .then(function(response) {
              console.log("From API request got response: ", response);
            });
  },

  actionCancel: function() {
    this.destroy();
  }

});

});
