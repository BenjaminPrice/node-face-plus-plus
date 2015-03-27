/**
 * Module Dependencies
 */

var request         = require('request')
    , qs            = require('qs')
    , url           = require('url')
    , noop          = function(){};

// Using `extend` from https://github.com/Raynos/xtend
function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]
            , keys   = Object.keys(source);

        for (var j = 0; j < keys.length; j++) {
            var name = keys[j];
            target[name] = source[name];
        }
    }

    return target;
}

/**
 * @private
 */

var apiKey                  = null
    , apiSecret             = null
    , apiUrl                = ['http://api','.faceplusplus.com/']
    , apiVersion            = '2' // default to the oldest version
    , apiServer             = 'us'
    , requestOptions        = {};

/**
 * Library version
 */

exports.version = '0.0.1';

/**
 * API Stream
 *
 * @param {String} method
 * @param {String} url
 * @param {object/function} data
 * - object to be used for post
 * - assumed to be a callback function if callback is undefined
 * @param {function/undefined} callback
 */

function API(method, url, data, callback) {
    if (typeof callback === 'undefined') {
        callback  = data;
        data  = {};
    }

    url             = this.prepareUrl(url);
    this.callback   = callback || noop;
    this.data       = data;

    this.options          = extend({}, requestOptions);
    this.options.encoding = this.options.encoding || 'utf-8';

    // these particular set of options should be immutable
    this.options.method         = method;
    this.options.uri            = url;
    this.options.followRedirect = false;

    this[method.toLowerCase()]();

    return this;
}

/**
 * "Prepares" given url string
 * - adds leading slash
 * - adds protocol and host prefix if none is given
 * @param {string} url string
 */
API.prototype.prepareUrl = function(url) {
    url = url.trim();

    if (url.substr(0,4) !== 'http') {
        // add leading slash
        if (url.charAt(0) !== '/') url = '/' + url;
        url = apiUrl[0] + apiServer + apiUrl[1] + 'v' + apiVersion + url;
    }

    return url;
};


/**
 * Gets called on response.end
 * @param {String|Object} body
 */

API.prototype.end = function (body) {
    var json = typeof body === 'string' ? null : body
        , err  = null;

    if (!json) {
        try {

            // this accounts for `real` json strings
            if (~body.indexOf('{') && ~body.indexOf('}')) {
                json = JSON.parse(body);

            } else {
                // this accounts for responses that are plain strings
                if (!~body.indexOf('='))    body = 'data=' + body;
                if (body.charAt(0) !== '?') body = '?' + body;

                json = url.parse(body, true).query;
            }

        } catch (e) {
            err = {
                message: 'Error parsing json'
                , exception: e
            };
        }
    }

    if (!err && (json && json.error)) err = json.error;

    this.callback(err, json);
};


/**
 * http.get request wrapper
 */

API.prototype.get = function () {
    var self = this;

    request.get(this.options, function(err, res, body) {
        if (err) {
            self.callback({
                message: 'Error processing http request'
                , exception: err
            }, null);

            return;
        }

        if (~res.headers['content-type'].indexOf('image')) {
            body = {
                image: true
                , location: res.headers.location
            };
        }

        self.end(body);
    });
};


/**
 * http.post request wrapper
 */

API.prototype.post = function() {

    var self     = this
        , data = this.data;

    var img = data.img;
    delete data.img;

    var r = request(this.options, function (err, res, body) {
        if (err) {
            self.callback({
                message: 'Error processing http request'
                , exception: err
            }, null);

            return;
        }

        self.end(body);
    });
    var form = r.form();
    form.append('api_key', apiKey);
    form.append('api_secret', apiSecret);
    form.append('img', img.value, img.meta);
    for (var key in data)
        if (data.hasOwnProperty(key)) {
            var obj = data[key];
            for (var prop in obj)
                if(obj.hasOwnProperty(prop))
                    form.append(prop, obj[prop]);
        }
};

/**
 * Performs a get request against the API
 *
 * @param {object} params
 * @param {string} url
 * @param {function} callback
 */

exports.get = function(url, params, callback) {
    if (typeof params === 'function') {
        callback = params;
        params   = null;
    }

    if (typeof url !== 'string') {
        return callback({ message: 'API url must be a string' }, null);
    }

    if (params)  {
        url += ~url.indexOf('?') ? '&' : '?';
        url += qs.stringify(params);
        url += '&' + qs.stringify({'api_key': apiKey, 'api_secret': apiSecret});
    }

    return new API('GET', url, callback);
};

/**
 * Publish to the API
 *
 * @param {string} url
 * @param {object} data
 * @param {function} callback
 */

exports.post = function (url, data, callback) {
    if (typeof url !== 'string') {
        return callback({ message: 'API url must be a string' }, null);
    }

    if (typeof data === 'function') {
        callback = data;
        data = {};
    }

    return new API('POST', url, data, callback);
};


/**
 * Set request options.
 * These are mapped directly to the
 * `request` module options object
 * @param {Object} options
 */

exports.setOptions = function (options) {
    if (typeof options === 'object')  requestOptions = options;

    return this;
};

/**
 * @returns the request options object
 */

exports.getOptions = function() {
    return requestOptions;
};

/**
 * Sets the API Key
 * @param {string} token
 */

exports.setApiKey = function(token) {
    apiKey = token;
    return this;
};

/**
 * @returns the API Key
 */

exports.getApiKey = function () {
    return apiKey;
};

/**
 * Set's the API version.
 * Note that you don't need to specify the 'v',
 * just '3', '2' etc
 * @param {string} version
 */
exports.setVersion = function (version) {
    apiVersion = version;
    return this;
};

/**
 * @returns the API Version
 */

exports.getApiVersion = function () {
    return apiVersion;
};

/**
 * Set's the API server.
 * 'us', 'cn' etc
 * @param {string} server
 */
exports.setServer = function (server) {
    apiServer = server;
    return this;
};

/**
 * @returns the API Server
 */

exports.getServer = function () {
    return apiServer;
};


/**
 * Sets the API Secret
 * @param {string} token
 */

exports.setApiSecret = function(token) {
    apiSecret = token;
    return this;
};

/**
 * @returns the API Secret
 */

exports.getApiSecret = function () {
    return apiSecret;
};