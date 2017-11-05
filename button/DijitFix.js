/**
 * Mixin class to make a dijit/form/Button-based widget look like button/Action
 */
define([
    "module",
    "dojo/_base/declare",
    "dojo/query",
    "dojo/NodeList-dom"
], function(module, declare, query) {

    return declare(null, { //--noindent--

        fixDijitButton: true,
        buttonClass: "button",

        /**
         * @override
         */
        buildRendering: function() {
            this.inherited(arguments);
            if (this.fixDijitButton) {
                query(".dijitButtonNode", this.domNode)
                    .removeClass("dijitButtonNode")
                    .addClass(this.buttonClass);
            }
        },

        /**
         * The Class name comes from module's -- used by declare()
         */
        declaredClass: module.id

    });

});