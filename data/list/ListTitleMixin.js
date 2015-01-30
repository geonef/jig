/**
 */
define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "geonef/jig/button/Action",
], function(module, declare, lang, Action) {

  return declare(null, {

    paneTitle: "",
    paneNodeTitle: "",
    titleLink: null,
    enableTitleClick: false,

    /**
     * Make DOM definitions of pane <h2> - called by concrete class' makeContentNodes()
     */
    makePaneTitleNode: function() {
      var content = this.getPaneTitle();
      var titleOptions;
      if (this.titleLink) {
        titleOptions = {
          onExecute: this.appView.deferOpen(
            this.titleLink === true ? this.constructor : this.titleLink,
            { user: this.user })
        };
      } else if (this.enableTitleClick) {
        titleOptions = {
          onExecute: lang.hitch(this, this.onTitleClick)
        };
      }

      return titleOptions ?
        [Action, lang.mixin({ nodeName: "h2", label: content, "class": "link stopf" }, titleOptions)]
      : ['h2', {"class":"stopf"}, content];
    },

    /**
     * Called by makePaneTitleNode() - can be overriden to provide dynamic titles
     */
    getPaneTitle: function() {
      return this.paneNodeTitle || this.paneTitle;
    },

    /**
     * @override for PaneMixin
     */
    makeTitle: function(titleNode) {
      return this.tempDom([
        ['span', {_insert: titleNode}, this.getPaneTitle() + this.getPagingLabel()]
      ]);
    },

    onTitleClick: function() {
      console.log("onTitleClick", this, arguments);
    },

    declaredClass: module.id

  });

});
