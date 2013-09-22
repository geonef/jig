/**
 * Mixin class for models aving an "ownerDoc" property
 *
 *  {
 *    ownerDoc: HasOwnerDocMixin.defProperty("target/model/amd/module")
 *  }
 *
 */
define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "../type/relation"
], function(module, declare, lang, relation) {

  var Self = declare(null, {

    /**
     * Name of ownerDoc property
     */
    ownerDocProperty: "ownerDoc",

    /**
     * If true, all topics on this doc will be forwarded to ownerDoc as well
     *
     * @type {boolean}
     */
    forwardTopicToOwner: true,

    /**
     * @override
     */
    publish: function(argsArray) {
      this.inherited(arguments);
      if (this[this.ownerDocProperty] && this.forwardTopicToOwner) {
        this[this.ownerDocProperty].publish([this.ownerDocProperty, [this].concat(argsArray)]);
      }
    },

    declaredClass: module.id

  });

  /**
   * Make a property definition for "ownerDoc"
   *
   * properties: lang.delegate(AbstractModel.prototype.properties, {
   *   ownerDoc: HasOwnerDocMixin.defProperty("geonef/iti/data/model/Step"),
   *   exampleProperty: { type: 'string' },
   *   ... more properties ...
   * })
   */
  Self.defProperty = function(targetModelRef) {
    return { type: relation.refOne, targetModel: targetModelRef, noEdit: true };
  };

  return Self;

});

