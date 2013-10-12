/**
 * Custom DOM node builders
 *
 * The output if these functions is meant to be processed through geonef/jig/util/makeDOM
 */
define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang"
], function(module, declare, lang) {

  var self = {

    /**
     * Build a <table>-based list
     *
     * A row can be:
     *          - ["The label", [TextBox, {_attach: "xyz"}]]
     *            Produces : <tr><td class="n">The label</td><td>(textbox widget)</td></tr>
     *
     *          - ["The label", [[TextBox, {_attach: "xyz"}], [TextBox2, {_attach: "xyz2"}]]]
     *            Produces : <tr><td class="n">The label</td><td>(textbox widget)(textbox2 widget)</td></tr>
     *
     *          - [[Action, {label: "OK"}], [Action, {label: "Cancel"}]]
     *            Produces : <tr><td colspan="2">(actionOk widget)(actionCancel widget)</td></tr>
     *
     *          //- ["tr", {style=".."}, [["div", {}, "Foo"], ["div", {}, "Bar"]]]
     *          //  Produces : <tr style=".."><td><div>Foo</div><div>Bar</div></td></tr>
     *
     * @param {Object} attrs    attributes to set on <table> element
     * @param {Array.<Array>} rows     array of rows
     */
    tableList: function(attrs, rows) {
      return ["table", {"class": "list"}, [
        ["tbody", attrs && attrs._tbodyAttrs,
         rows.map(function(row) {
           return ["tr", {}, row[1] ?
                   [
                     ["td", {"class": "n"}, row[0]],
                     ["td", {}, row[1]],
                   ] :
                   [["td", {colspan: "2"}, row[0]]]
                  ];
         })
        ]]];
    },

    formEntries: function(rows) {
      if (!(rows instanceof Array)) {
        return self.formEntriesCompat.apply(null, arguments);
      }

      return rows.map(self.formEntry);
    },

    formEntry: function(row) {
      var content = [
        ["span", {"class":"label"}, row.title],
        row.editorNode
      ];
      if (row.description) {
        content.push(["div", {"class":"hint"}, row.description]);
      }
      return ["div", {"class": "line stopf"}, content];
    },


    formEntriesCompat: function(options, rows) {
      return rows.map(function(row) {
        var hasLabel = typeof row[0] === "string";
        return ["div", {"class": "line stopf"}, hasLabel ?
                [
                  ["span", {"class": "label"}, row[0]],
                  ["span", {}, row[1]],
                ] :
                row[0]];
      });
    }

  };

  return self;

});

