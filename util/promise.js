/**
 * For compat-only
 */
define([
  "./async",
  "dojo/_base/kernel"
], function(async, kernel) {

  kernel.deprecated("geonef/jig/util/promise",
                    "Use util/async instead");

  return async;
});

