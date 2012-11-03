/**
 * Runner for Geonef tests
 *
 * TODO:
 *      - configure level of verbosity (when running)
 *      - save all successes/failures and dump them at end (within structure)
 */
define([
  "module",
  "require",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/when",
  "dojo/Deferred",
], function(module, require, declare, lang, when, Deferred) {

  "use strict";

return declare('geonef/jig/test/Runner', null, { //--noindent--

  clearConsole: true,

  timeout: 15000,


  constructor: function(options) {
    lang.mixin(this, options);
  },

  /**
   * Run the tests
   *
   * @param {Function} func     Test function to execute
   */
  run: function(func) {
    if (this.clearConsole) {
      console.clear !== undefined && console.clear();
    }
    console.log('STARTING TEST PROCEDURE', this);
    this.currentGroup = null;
    var ret;
    if (func.prototype && func.prototype.execute) {
      ret = this.classGroup(func);
    } else {
      ret = this.group(func, "[root]");
    }
    return when(ret,
                lang.hitch(this, this.finish, true),
                lang.hitch(this, this.finish, false));
  },

  /**
   * Execute the given function in a sub group
   *
   * If 'name' is not given, will be taken from 'func.name'.
   *
   * @param {string?} name (optional)
   * @param {Function} func
   * @return {mixed}
   */
  group: function(nameOrScope, func) {
    var args = lang._toArray(arguments, 2);
    var name = nameOrScope;

    if (typeof nameOrScope === "object") {
      name = func.name || func.nom;
      func = lang.hitch(nameOrScope, func);

    } else if (typeof nameOrScope === "function") {
      args.unshift(func);
      func = nameOrScope;
      name = nameOrScope.name || "[anonymous]";
    }
    args.unshift(this);

    var group = {
      name: name,
      successCount: 0,
      failureCount: 0,
      childGroups: [],
      parentGroup: this.currentGroup
    };
    if (!this.rootGroup) {
      this.rootGroup = group;
    }
    if (this.currentGroup) {
      this.currentGroup.childGroups.push(group);
    }
    this.currentGroup = group;

    var _this = this;
    function finish() {
      _this.rlog("END");
      _this.currentGroup = group.parentGroup;
    }

    _this.rlog("BEGIN");
    var ret;
    try {
      ret = func.apply(null, args);
    } catch (error) {
      this.fail("-- SYNC EXEC EXCEPTION '"+error.name+": "+error.message);
      finish();
      throw new Error("sub-group has failed with exception");
    }

    if (ret && ret.then) {
      var deferred = new Deferred();
      group.timeout = function() {
        _this.fail("promise timeout!");
        finish();
        deferred.reject(new Error("sub-group has timed-out"));
      };
      ret.then(
        function(value) {
          _this.pass("-- ASYNC RESOLVED | return="+value);
          finish();
          deferred.resolve(value);
        },
        function(error) {
          _this.fail("-- ASYNC REJECTED | '"+error);
          finish();
          deferred.reject(new Error("sub-group has failed"));
        });
      ret = deferred;
    } else {
      this.pass("-- SYNC EXEC DONE | return="+ret);
      finish();
    }

    return ret;
  },

  /**
   * Same as group(), but wrap it like dojo's hitch() for later execution
   *
   * This is useful in promise-style code :
   *    myAsyncFunc().then(test.hitchGroup(function myDeferredGroup() { ... }))
   *
   * @param {string?} nameOrScope (optional)
   * @param {Function} func
   * @return {mixed}
   */
  hitchGroup: function(nameOrScope, func) {
    return lang.hitch.apply(
      null, lang._toArray(arguments, 0, [this, this.group]));
  },

  /**
   * Run a test class in a group - same as group(), with classes
   *
   * The given class in instanciated with 2 args :
   *    - the first arg is the runner itself (this)
   *    - the second arg is the 'options' parameter.
   *
   * Then it's 'execute()' method is executed. It can be async.
   *
   * @param {Function} TestClass        The test class
   * @param {Object} options            Options to give to constructor
   * @return {mixed} Return value from class' execute()
   */
  classGroup: function(TestClass, options) {
    var name = (options && options.name) ||
      TestClass.prototype.name ||
      TestClass.prototype.declaredClass  || "<class>";
    var _this = this;
    return this.group(name, function() {
      var obj = new TestClass(_this, options);
      return when(obj.execute(), function(value) {
        if (obj.tearDown) {
          obj.tearDown();
        }
        if (obj.destroy) {
          obj.destroy();
        }
        return value;
      });
    });
  },

  /**
   * Set (or reset) the name if current group
   */
  setName: function(name) {
    this.currentGroup.name = name;
  },

  /**
   * Get absolute name of current group
   */
  getAbsName: function() {
    var parts = [];
    for (var group = this.currentGroup; group; group = group.parentGroup) {
      parts.unshift(group.name.replace(/.+\/test\//, ""));
    }
    return parts.join(" > ");
  },




  ////////////////////////////////////////////////////////////////////
  // Assertions

  /**
   * Records a success
   *
   * @param {string} message
   */
  pass: function(message) {
    console.info(this.getAbsName()+" | PASS: ", message);
    this.currentGroup.successCount++;
  },

  /**
   * Records an failure
   *
   * @param {string} message
   */
  fail: function(message) {
    console.error(this.getAbsName()+" | FAIL: ", message);
    this.currentGroup.failureCount++;
  },

  log: function(message) {
    console.info(this.getAbsName()+" | LOG: ", message);
  },

  rlog: function(message) {
    console.warn(this.getAbsName()+" | "+ message);
    // console.log("  "+this.getAbsName()+" | ", message);
  },



  ////////////////////////////////////////////////////////////////////
  // "PRIVATE" methods

  // resetTimeout: function() {
  //   if (this._timeoutID) {
  //     window.global.clearTimeout(this._timeoutID);
  //   }
  //   if (!this.finished) {
  //     this._timeoutID = window.global.setTimeout(
  //       lang.hitch(this, this.onTimedOut), this.timeout);
  //   }
  // },

  // onTimedOut: function() {
  //   if (!this.finished) {
  //     console.error("Timeout!", this.timeout, "seconds with no activity");
  //     this.result.failureCount++;
  //     this.finish();
  //   }
  // },

  finish: function(isSuccess, lastRet) {
    this.finished = true;
    console.log('TEST PROCEDURE IS FINISHED!', this);
    this.processGroups();
    this.showReport();
    return isSuccess;
    // var msg = this.test.totalFailureCount > 0 ?
    //   "The test procedure has failed :(\n"
    //   + this.test.totalFailureCount+" errors have been reported, "
    //   + "see the console for details." :
    //   "The test procedure is finished successfully, "
    //   + this.test.totalSuccessCount+" tests were passed :)\n";
    // window.global.alert(msg);
  },

  processGroups: function() {
    if (!this.rootGroup) {
      throw new Error("showReport(): no root group (was it run ?)");
    }

    var processGroup = function(group) {
      group.totalSuccessCount = group.successCount;
      group.totalFailureCount = group.failureCount;
      group.childGroups.forEach(
        function(childGroup) {
          processGroup(childGroup);
          group.totalSuccessCount += childGroup.totalSuccessCount;
          group.totalFailureCount += childGroup.totalFailureCount;
        });
    };

    processGroup(this.rootGroup);
  },

  showReport: function() {
    if (!this.rootGroup) {
      throw new Error("showReport(): no root group (was it run ?)");
    }
    var dumpGroup = function(group, dontCollapse) {
      var info = "";
      info += "ok="+group.totalSuccessCount + "" +
        "   fail="+group.totalFailureCount + "";
      info += "";
      if (dontCollapse === true) {
        console.group(group.name, " ~ ", info);
      } else {
        console.groupCollapsed(group.name, " ~ ", info);
      }
      // var struct = {
      //   totalSuccessCount: group.totalSuccessCount,
      //   totalFailureCount: group.totalFailureCount,
      //   successCount: group.successCount,
      //   failureCount: group.failureCount,
      //   rawStructure: group
      // };
      group.childGroups.forEach(dumpGroup);
      console.dir(group);
      console.groupEnd();
    };

    dumpGroup(this.rootGroup, true);
  },

  declaredClass: module.id

});

});
