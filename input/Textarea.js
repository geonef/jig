define([
  "module",
  "dojo/_base/declare",
  "dijit/form/Textarea",
  "./_TextMixin",
], function(module, declare, Textarea, _TextMixin) {


  return declare([Textarea, _TextMixin], {

    executeKeyMod: "ctrl",
    declaredClass: module.id

  });

});
