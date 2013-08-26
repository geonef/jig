/**
 * Description courte du module (obligatoire)
 *
 * Description plus longue du module (conseillé)
 */
define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang"
], function(module, declare, lang) {

  var Self = declare(null, {

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
      if (this.ownerDoc && this.forwardTopicToOwner) {
        this.ownerDoc.publish(["ownedDoc", [this].concat(argsArray)]);
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
    return { type: 'refOne', targetModel: targetModelRef, noEdit: true };
  };

  return Self;

});

