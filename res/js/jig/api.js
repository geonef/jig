
dojo.provide('jig.api');

dojo.require('dojox.uuid.generateRandomUuid');

dojo.mixin(jig.api,
{

  // summary:
  //    Default URL, if not given in params
  ///
  url: '/api',

  // requestCommonParams: object
  //    Common parameters which are added automatically to every request
  requestCommonParams: {},

  // noticeTopic: string
  //    Name of topic to publish events to. First arg is a boolean telling whether an XHR is active
  noticeTopic: 'jig/api/request',

  // _deferredRequests: object
  //    Parallel requests deferred to later execution
  _deferredRequests: {},

  // summary:
  //    Make API request
  //
  // xhrOptions: object for parameters to pass to dojo XHR.
  //    Custom params are:
  //            - defer: boolean
  //                    if true, the request is remembered, and is executed
  //                    the next time a request is made with a falsy defer.
  //
  request: function(request, xhrOptions) {
    xhrOptions = xhrOptions || {};
    var uuid = dojox.uuid.generateRandomUuid();
    jig.api._deferredRequests[uuid] = request;
    if (!xhrOptions.defer) {
      var reqs = dojo.mixin({}, jig.api._deferredRequests);
      jig.api._deferredRequests = {};
      jig.api._doRequest(reqs, xhrOptions);
    }
  },

  _doRequest: function(request, xhrOptions) {
    var _processReq = function(request, response, xhr) {
      var ret;
      if (request.callback) {
	//console.log('XHR: calling callback', arguments);
	if (response.status === 'error') {
	  console.error('error status from API', response);
	}
	ret = request.callback(response, xhr);
      }
      return ret;
    },
    _processResponse = function(text, xhr) {
      //console.log('JiG API Response', xhr, text);
      dojo.publish('noticeTopic', [ false ]);
      var ret = 0, data = null;
      try {
	data = dojo.fromJson(text);
      }
      catch (e) {
	console.error('JiG  API response: invalid JSON string: ',
	              text, xhr);
	if (dojo.isFunction(request.transportError)) {
	  request.transportError(text, xhr);
	}
	return false;
      }
      // check if one req or many in the structure
      if (dojo.isFunction(request.callback)) {
	ret = _processReq(request, data, xhr);
      } else {
	for (var i in data) {
          if (data.hasOwnProperty(i)) {
	    ret = _processReq(request[i], data[i], xhr);
	  }
        }
      }
      data.callbackStatus = ret;
      //console.log('returning', ret);
      return ret;
    },
    _processError = function(error, xhr) {
      dojo.publish('noticeTopic', [ false ]);
      console.error('JiG API Error: ', error, xhr);
    };
    if (request.module) {
      dojo.mixin(request, jig.api.requestCommonParams);
    } else {
      dojo.forEach(request, // forEach on object ??
        function(r) { dojo.mixin(r, jig.api.requestCommonParams); });
    }
    dojo.publish('noticeTopic', [ true ]);
    return dojo.xhr('POST', dojo.mixin(
                      {
                        url: xhrOptions.url || jig.api.url,
                        handleAs: 'text', //'json',
                        postData: dojo.toJson(request),
                        load: _processResponse,
                        error: _processError
                      }, xhrOptions), true);
  }

});
