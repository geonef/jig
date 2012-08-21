var profile = (function()
{
  var testResourceRe = /^geonef\/jig\/test\//;

  var copyOnly = function(filename, mid) {
    var list = {
      "geonef/jig/jig.profile":1,
      "geonef/jig/package.json":1,
    };

    return (mid in list) || (/^geonef\/jig\/resources\//.test(mid) && !/\.css$/.test(filename)) || /(png|jpg|jpeg|gif|tiff)$/.test(filename);
  };

  // var excludes = [
  // ];

  // var excludesRe = new RegExp(("^geonef/jig/(" + excludes.join("|") + ")").replace(/\//, "\\/"));

  // var usesDojoProvideEtAl = function(mid){
  //   return excludesRe.test(mid);
  // };


  return {
    resourceTags:{
      test: function(filename, mid){
        return false; // no test yet
	// return testResourceRe.test(mid) || mid=="dijit/robot" || mid=="dijit/robotx";
      },

      copyOnly: function(filename, mid){
	return copyOnly(filename, mid);
      },

      amd: function(filename, mid){
	return !testResourceRe.test(mid) &&
          !copyOnly(filename, mid) &&
          // !usesDojoProvideEtAl(mid) &&
          /\.js$/.test(filename);
      },

      miniExclude: function(filename, mid){
        return false;
      	// return /^dijit\/bench\//.test(mid) || /^dijit\/themes\/themeTest/.test(mid);
      }
    },

    trees:[
      [".", ".", /(\/\.)|(~$)/]
    ]
  };

})();



