
dojo.provide('geonef.jig.api');

dojo.require('dojox.uuid.generateRandomUuid');

dojo.mixin(geonef.jig.api,
{
  //
  // todo:
  //    implement caching based in scalar params
  //

  /**
   * @type {string} Default URL, if not given in params
   */
  url: '/api',

  /**
   * @type {Object} Common parameters which are added automatically to every request
   */
  requestCommonParams: {},

  /**
   * @type {string} Name of topic to publish events to. First arg is a boolean telling whether an XHR is active
   */
  noticeTopic: 'jig/api/request',

  /**
   * @type {Object} Parallel requests deferred to later execution
   */
  _deferredRequests: {},

  /**
   * @type {geonef.jig.Deferred} Global XHR promise for pending XHR call
   */
  _deferred: null,

  /**
   * Make API request
   *
   *    Custom params are:
   *            - defer: boolean
   *                    if true, the request is remembered, and is executed
   *                    the next time a request is made with a falsy defer.
   *
   * @param {?Object} object for parameters to pass to dojo XHR.
   * @return {dojo.Deferred} promise, ensured to be geoenf.jig.Deferred if request.callback is set
   */
  request: function(request, xhrOptions) {
    xhrOptions = xhrOptions || {};
    var uuid = dojox.uuid.generateRandomUuid();
    request.promise = new geonef.jig.Deferred();
    var ret = request.promise;
    geonef.jig.api._deferredRequests[uuid] = request;
    if (!geonef.jig.api._timeout) {
      geonef.jig.api._deferred = new geonef.jig.Deferred();
      geonef.jig.api._timeout = window.setTimeout(
          function() {
            // execute all deferred requests
            geonef.jig.api._timeout = null;
            var reqs = dojo.mixin({}, geonef.jig.api._deferredRequests);
            geonef.jig.api._deferredRequests = {};
            geonef.jig.api._deferred.dependsOn(geonef.jig.api._doRequest(reqs, xhrOptions));
            geonef.jig.api._deferred.callback();
          }, 0);
    }
    if (request.callback) {
      // backward compat ; api.request({}).then() preferred
      ret = new geonef.jig.Deferred();
      request.promise
        .then(dojo.hitch(request.scope || window, request.callback))
        .then(function() { ret.callback(); });
    }
    delete request.scope;
    delete request.callback;

    return ret;
  },

  /**
   * Execute XHR for all deferred requests
   *
   * @return {dojo.Deferred} from XHR call
   */
  _doRequest: function(request, xhrOptions) {

    /**
     * Process single-request response
     */
    var _processResponseReq = function(request, response, xhr) {
      var ret;
      // if (request.callback) {
	//console.log('XHR: calling callback', arguments);
	if (response.status === 'error') {
	  console.error('error status from API', response);
	}
	if (response.status === 'exception') {
	  console.error('Server API exception', response);
          geonef.jig.api.processException(request, response);
	}
      request.promise.resolve(response);
    };

    /**
     * Process XHR (transport) response
     */
    var _processResponse = function(text, xhr) {
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
	return;
      }
      // check if one req or many in the structure
      if (dojo.isFunction(request.callback)) {
	_processResponseReq(request, data, xhr);
      } else {
	for (var i in data) {
          if (data.hasOwnProperty(i)) {
	    _processResponseReq(request[i], data[i], xhr);
	  }
        }
      }
    };

    /**
     * Process XHR (transport) failure
     */
    var _processError = function(error, xhr) {
      dojo.publish('noticeTopic', [ false ]);
      console.error('JiG API Error: ', error, xhr);
    };

    /**
     * Make single request structure out of single request params
     *
     * @param {Object} origRequest
     * @return {Object} the structure ready to be serialized
     */
    var _prepareRequest = function(origRequest) {
      var ret = dojo.mixin({}, origRequest, geonef.jig.api.requestCommonParams);
      delete ret.promise;
      return ret;
    };

    var requestToSend;
    if (request.module) {
      requestToSend = _prepareRequest(request);
    } else {
      requestToSend = {};
      for (var i in request) {
        if (request.hasOwnProperty(i)) {
          requestToSend[i] = _prepareRequest(request[i]);
        }
      }
    }
    dojo.publish('noticeTopic', [ true ]);
    return dojo.xhr('POST', dojo.mixin(
                      {
                        url: xhrOptions.url || geonef.jig.api.url,
                        handleAs: 'text', //'json',
                        postData: dojo.toJson(requestToSend),
                        load: _processResponse,
                        error: _processError
                      }, xhrOptions), true);
  },

  processException: function(request, response) {
    var Class = geonef.jig.util.getClass('geonef.jig.tool.dev.ExceptionDump');
    var dump = new Class(
      dojo.mixin({ context: { request: request, response: response }},
                 response.exception));
    geonef.jig.workspace.autoAnchorWidget(dump);
    dump.startup();
    console.log('started exception', this, arguments);
  }

});
