/**
 * Custom DOM node builders
 *
 * The output if these functions is meant to be processed through geonef/jig/util/makeDOM
 */
define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/dom-geometry",
  "dojo/dom-style",
  "dojo/dom-construct",
  "./async",
  "./object",
], function(module, declare, lang, geom, style, construct, async, object) {

  var self = {

    measure: function(dojoGeomFunction, node, options) {
      options = object.mixOptions({
        width: "auto"
      }, options);
      var cont = construct.create("div", {"style":"position:absolute;z-index:-10;width:"+
                                          options.width+";height:0;overflow:hidden;"},
                                  document.body);
      var oldParent = node.parentNode;
      cont.appendChild(node);

      var value;

      return async.whenSatisfied(function() {
        return geom.getContentBox(node).w !== 0;
      }).then(function() {

        value = geom[dojoGeomFunction](node);
        cont.removeChild(node);
        document.body.removeChild(cont);
        if (oldParent) {
          oldParent.appendChild(node);
        }

        return value;
      });
    },

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

    /**
     * @param {Array} rows    see formEntry() for info
     */
    formEntries: function(rows) {
      if (!(rows instanceof Array)) {
        return self.formEntriesCompat.apply(null, arguments);
      }

      return rows.map(self.formEntry);
    },

    /**
     * @param {{title: string, editorNode: Array, description: string}}
     */
    formEntry: function(row) {
      var content = [
        ["span", {"class":"label"}, row.title],
        row.editorNode
      ];
      if (row.description) {
        content.push(["div", {"class":"hint"}, row.description]);
      }
      return ["div", {"class": "line stopf "+(row.entryClass||"")}, content];
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
