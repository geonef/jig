
dojo.provide('zig.api');

zig.api = {

  // summary:
  //    Default URL, if not given in params
  ///
  url: '/api',

  // summary:
  //    Make API request
  //
  request: function(request, xhrOptions) {
    console.dir(xhrOptions);
    //console.log('making API request', request, dojo.toJson(request));
    var _processReq = function(request, response, xhr) {
      var ret;
      if (request.callback) {
	//console.log('XHR: calling callback', arguments);
	if (response.status === 'error') {
	  console.err('error status from API', response);
	}
	ret = request.callback(response, xhr);
      }
      return ret;
    },
    _processResponse = function(text, xhr) {
      console.log('ZiG API Response', xhr, text);
      var ret = 0;
      try {
	data = dojo.fromJson(text);
      }
      catch (e) {
	console.error('ZiG  API response: invalid JSON string: ',
	              text, xhr);
	if (dojo.isFunction(request.transportError)) {
	  request.transportError(text, xhr);
	}
	return;
      }
      // check if one req or many in the structure
      if (dojo.isString(data.status)) {
	ret = _processReq(request, data, xhr);
      } else {
	for (var i in data) { if (data.hasOwnProperty(i)) {
		                ret = _processReq(request[i], data[i], xhr);
		              }}
      }
      data.callbackStatus = ret;
      //console.log('returning', ret);
      return;
    },
    _processError = function(error, xhr) {
      console.error('ZiG API Error: ', error, xhr);
    };
    if (request.module) {
      dojo.mixin(request, this.requestCommonParams);
    } else {
      dojo.forEach(request, function(r) {
        	     dojo.mixin(r, this.requestCommonParams);
        	   });
    }
    return dojo.xhr('POST', dojo.mixin(
                      {
                        url: xhrOptions.url || zig.io.api.url,
                        handleAs: 'text', //'json',
                        postData: dojo.toJson(request),
                        load: _processResponse,
                        error: _processError
                      }, xhrOptions), true);
  }

};
