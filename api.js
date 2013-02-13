define([
  "require",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/window",
  "dojo/_base/xhr",
  "dojo/json",
  "dojo/topic",
  "./util/value",

  "dojox/uuid/generateRandomUuid",
  "dojo/Deferred",
], function(require, declare, lang, window, request, json, topic, value,
            generateRandomUuid, Deferred) {

  var ApiError = declare(Error, {

    constructor: function(errorData) {
      this.name = "ApiError";
      this.type = errorData.name;
      this.message = errorData.message || "(no details)";
      this.error = errorData;
    },

    // toString: function() {
    //   return 'ApiError "'+this.name+'": '+this.message;
    // },
    // toLocaleString: function() {
    //   return 'ApiError "'+this.name+'": '+this.message;
    // },


    declaredClass: "ApiError"
  });

  var self = {

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
     * Whether to show exceptions to the user
     *
     * @type {boolean}
     */
    showExceptions: false,

    /**
     * Number of seconds between pings, when no API request is made during that time
     */
    pingDelay: 300,

    /**
     * Delay in milliseconds of extra-time to wait before sending the XHR
     *
     * (used for debugging)
     */
    debugDelay: 0,

    /**
     * @type {Object} Parallel requests deferred to later execution
     */
    _deferredRequests: {},

    /**
     * @type {dojo/Deferred} Global XHR promise for pending XHR call
     */
    _deferred: null,

    /**
     * Make API request - asynchronous
     *
     * @param {Object} req Request object
     * @param {?Object} object for parameters to pass to dojo XHR.
     * @return {dojo/Deferred} promise, resolved with response
     */
    request: function(req, options) {
      self.cancelPing();
      options = options || {};
      req.promise = new Deferred();
      topic.publish(this.noticeTopic, { request: req, options: options });
      var ret = req.promise;
      if (options) {
        req.__options = options;
      }
      self._deferredRequests[generateRandomUuid()] = req;
      if (!self._timeout) {
        self._deferred = new Deferred();
        self._timeout = window.global.setTimeout(
          function() {
            // execute all deferred requests
            self._timeout = null;
            var reqs = lang.mixin({}, self._deferredRequests);
            self._deferredRequests = {};
            self._doRequest(reqs, options).then(
              function() {
                self._deferred.resolve();
              });
          }, self.debugDelay);
      }
      if (req.callback) {
        // backward compat for req.callback ; api.request({}).then() preferred
        ret = new Deferred();
        req.promise
          .then(lang.hitch(req.scope || window, req.callback))
          .then(function() { ret.resolve(); });
      }
      delete req.scope;
      delete req.callback;

      return ret;
    },

    /**
       * Execute XHR for all deferred requests
       *
       * @return {dojo/Deferred} from XHR call
       */
    _doRequest: function(req, options) {

      /**
       * Process single-request response
       */
      var _processResponseReq =
        function(req, response) {
          var options = req.__options || {};
          if (response.error) {
            req.promise.reject(new ApiError(response.error));
            return;
          }
	  if (response.status === 'error') {
            // this type of response is deprecated
            console.error('error status from API', response);
	  }
	  if (response.status === 'exception' && !options.ignoreException) {
            // this type of response is deprecated
            console.error('Server API exception', response);
            self.processException(req, response);
            req.promise.reject(new ApiError({name: "unknown:exception"}));
            return;
	    }
          // try {
          req.promise.resolve(response);
          // } catch (error) {
          // console.error("exception in API request callback", req, response);
          // }
        };

      /**
       * Process XHR (transport) response
       */
      var _processResponse = function(text, xhr) {
        //console.log('JiG API Response', xhr, text);
        // topic.publish('noticeTopic', false);
        var i, data = null;
        try {
          data = json.parse(text);
        }
        catch (e) {
          console.error('JiG  API response: invalid JSON string: ',
                        text, xhr);
          for (i in req) {
            if (req.hasOwnProperty(i)) {
              req[i].promise.reject(new ApiError({
                name: "transport:failed",
                message: "invalid JSON"
              }));
            }
          }
	  return;
        }
        // check if one req or many in the structure
        if (typeof req.callback === 'function') {
          _processResponseReq(req, data, xhr);
        } else {
          for (i in data) {
            if (data.hasOwnProperty(i)) {
              _processResponseReq(req[i], data[i], xhr);
            }
          }
        }
        self.delayPing();
      };

      /**
       * Process XHR (transport) failure
       */
      var _processError = function(error, xhr) {
        console.error('JiG API transport Error: ', error, xhr);
          for (var i in req) {
            if (req.hasOwnProperty(i)) {
              req[i].promise.reject(new ApiError({name: "transport:failed"}));
            }
          }
      };

      /**
       * Make single request structure out of single request params
       *
       * @param {Object} origRequest
       * @return {Object} the structure ready to be serialized
       */
      var _prepareRequest = function(origRequest) {
        var ret = lang.mixin({}, origRequest, self.requestCommonParams);
        delete ret.promise;
        delete ret.__options;
        return ret;
      };

      var requestToSend;
      if (request.module) {
        requestToSend = _prepareRequest(req);
      } else {
        requestToSend = {};
        for (var i in req) {
          if (req.hasOwnProperty(i)) {
            requestToSend[i] = _prepareRequest(req[i]);
          }
        }
      }

      return request.post(lang.mixin({
        url: options.url || self.url,
        handleAs: 'text',
        postData: json.stringify(requestToSend),
      }, options), true)
        .then(_processResponse, _processError);
    },

    processException: function(req, response) {
      if (self.showExceptions) {
        value.getModule('geonef/jig/tool/dev/ExceptionDump').then(
          function(_Class) {
            var dump = new _Class(
              lang.mixin({ context: { request: req, response: response }},
                         response.exception));
            require("geonef/jig/workspace").autoAnchorWidget(dump);
            dump.startup();
          });
      } else {
        window.global.alert("Une erreur est survenue durant la requête serveur.\n" +
                            "Elle a été enregistrée en vue d'une correction prochaine.");
      }
      // console.log('started exception', this, arguments);
    },

    /**
     * Send a dumb API request to preserve the session (timed-out)
     *
     * Called after an effective API request has been sent.
     * The timeout cleared before an API request is sent.
     */
    delayPing: function() {
      var delay = self.pingDelay * 1000;
      self._pingTO = window.global.setTimeout(self.doPing, delay);
    },

    cancelPing: function() {
      if (self._pingTO) {
        window.global.clearTimeout(self._pingTO);
        delete self._pingTO;
      }
    },

    doPing: function() {
      self.request({ module: 'user', action: 'ping' } );
    },

  };

  return self;

});
