/**
 * JSON application transport - the one used for the Geonef servers
 *
 */
define([
  "module",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/window",
  "dojo/_base/xhr",
  "dojo/has",
  "dojo/json",
  "dojo/topic",
  "../util/async",

  "../util/generateRandomUuid",
  "dojo/Deferred",
  "dojo/promise/all",
], function(module, declare, lang, window, request, has, json, topic, async,
            generateRandomUuid, Deferred, whenAll) {

  var h = lang.hitch;

  var ApiError = declare(Error, {

    constructor: function(errorData) {
      this.name = "ApiError";
      this.type = errorData.name;
      this.message = errorData.message || "(no details)";
      this.error = errorData;
    },

    declaredClass: "ApiError"

  });

  var Self = declare(null, {

    /**
     * Related application - mandatory
     *
     * @type {geonef/jig/data/model/App}
     */
    app: null,

    /**
     * @type {string} Default URL, if not given in params (relative to app's)
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
     *
     * Set to null to disable the grouping of API requests
     */
    timeout: 0,

    /**
     * Limit upon the number of API calls per XHR
     *
     * If more API calls are made within the timeout, several XHR will be made
     *
     * @type {number}
     */
    maxReqsPerXHR: 40,

    /**
     * Delay between different XHR made because of maxReqsPerXHR
     */
    subsequentXHRDelay: 400,

    /**
     * Parallel requests deferred to later execution
     *
     * @type {Object}
     */
    _deferredRequests: {},

    /**
     * @type {dojo/Deferred} Global XHR promise for pending XHR call
     */
    _deferred: null,

    /**
     * constructor
     */
    constructor: function(options) {
      lang.mixin(this, options);
      this._deferredRequests = {};
      this.delayPing();
    },

    /**
     * Execute a command - the only public method
     */
    command: function(command, options) {
      // console.log("command!", this, arguments);
      return this.request(command, options)/*.then(function(data) {
        // console.log("command ret", arguments);
        return data;
      })*/;
    },

    /**
     * Make an API request - asynchronous
     *
     * @param {Object} req Request object
     * @param {?Object} object for parameters to pass to dojo XHR.
     * @return {dojo/Deferred} promise, resolved with response
     */
    request: function(req, options) {
      this.cancelPing();
      options = options || {};
      var ret = req.promise = new Deferred();
      ret._request = req;
      ret.whenSealed = new Deferred();
      topic.publish(this.noticeTopic, { request: req, options: options });
      if (options) {
        req.__options = options;
      }
      this._deferredRequests[generateRandomUuid()] = req;

      var _this = this;

      var executeRequests = h(this, function() {
        // execute all deferred requests
        this._timeout = null;
        var reqs = lang.mixin({}, this._deferredRequests);
        this._deferredRequests = {};
        var _deferred = this._deferred;

        // Take maxReqsPerXHR into account by dividing API calls into groups
        var blocks = Object.keys(reqs).reduce(function(blocks, currentKey, idx) {
          var lastObj = blocks[blocks.length - 1];
          if (!lastObj || Object.keys(lastObj).length >= _this.maxReqsPerXHR) {
            blocks.push(lastObj = {});

          }
          lastObj[currentKey] = reqs[currentKey];
          return blocks;
        }, []);
        if (blocks.length > 1) {
          console.info("API: got", Object.keys(reqs).length, "calls, devided into", blocks.length, "XHR");
        }

        // Call this._doRequest() for actual XHR
        whenAll(blocks.map(function(block, idx) {
          return async.whenTimeout(idx * this.subsequentXHRDelay)
            .then(function() { return _this._doRequest(block, options); });
        })).then(function() { _deferred.resolve(); });
      });

      if (!this._timeout) { // order requests, if none is pending through setTimeout()
        this._deferred = new Deferred();
        if (this.timeout === null) {
          executeRequests();
        } else {
          this._timeout = window.global.setTimeout(executeRequests, this.timeout);
        }
      }

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
            if (response.exception) {
              console.info("API exception:", response.exception.message);
              if (response.exception.previous) {
                console.info("API previous exception:", response.exception.previous.message);
              }
            }
            req.promise.reject(new ApiError(response.error));
            return;
          }
          req.promise.resolve(response);
        };

      /**
       * Process XHR (transport) response
       */
      var _processResponse = h(this, function(text, xhr) {
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
            if (data.hasOwnProperty(i) && req[i]) {
              _processResponseReq(req[i], data[i], xhr);
            }
          }
        }
      });

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
      var _prepareRequest = h(this, function(origRequest) {
        origRequest.promise.whenSealed.resolve(origRequest);
        var ret = lang.mixin({}, origRequest, this.requestCommonParams);
        delete ret.promise;
        delete ret.__options;
        return ret;
      });

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
      if (has("geonef-debug")) {
        try {
          var jsonText = json.stringify(requestToSend);
        } catch (error) {
          console.error("error when stringifying object:", requestToSend);
          throw error;
        }
      } else {
        var jsonText = json.stringify(requestToSend);
      }

      return request.post(lang.mixin({
        url: this.app.baseUrl + (options.url || this.url),
        handleAs: 'text',
        postData: jsonText,
      }, options), true)
        .then(_processResponse, _processError);
    },

    /**
     * Send a dumb API request to preserve the session (timed-out)
     *
     * Called after an effective API request has been sent.
     * The timeout cleared before an API request is sent.
     */
    delayPing: function() {
      var delay = this.pingDelay * 1000;
      this._pingTO = window.global.setTimeout(h(this, this.doPing), delay);
    },

    cancelPing: function() {
      if (this._pingTO) {
        window.global.clearTimeout(this._pingTO);
        delete this._pingTO;
      }
    },

    doPing: function() {
      this.command({ module: 'user', action: 'ping' } );
    },

    declaredClass: module.id

  });

  return Self;

});
