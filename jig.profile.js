var profile = (function()
{
  var testResourceRe = /^geonef\/jig\/test\//;

  var copyOnly = function(filename, mid) {
    var list = {
      "geonef/jig/jig.profile":1,
      "geonef/jig/package.json":1,
    };

    return mid in list;
  };

  return {
    resourceTags:{
      test: function(filename, mid){
        return testResourceRe.test(mid);
      },

      copyOnly: function(filename, mid){
	return copyOnly(filename, mid);
      },

      amd: function(filename, mid){
	return !testResourceRe.test(mid) &&
          !copyOnly(filename, mid) &&
          /\.js$/.test(filename);
      },

      miniExclude: function(filename, mid){
        return false;
      }
    },

    trees:[
      [".", ".", /(\/\.)|(~$)/]
    ]
  };

})();
