/*!
 * Request v0.2.6
 * http://www.noindoin.com/
 *
 * Copyright 2014 Jiang Fengming <fenix@noindoin.com>
 * Released under the MIT license
 */

function Request(defaults) {
  this.defaults = {};
  for (var k in Request.defaults)
    this.defaults[k] = Request.defaults[k];
  if (defaults) {
    for (k in defaults)
      this.defaults[k] = defaults[k];
  }
}

Request.defaults = {
  base: '',
  prefilter: null,
  send: null
};

Request.profiles = {
  jsonrpcPromise: {
    onload: function() {
      var data;
      if (this.status >= 200 && this.status < 300 || this.status == 304) {
        try {
          data = JSON.parse(this.responseText);
        } catch (e) {
          return this.reject({
            code: 'EJSONPARSE',
            message: 'JSON parse error'
          });
        }
      } else {
        return this.reject({
          code: 'HTTP' + this.status,
          message: this.statusText
        });
      }

      data.error ? this.reject(data.error) : this.resolve(data.result);
    },

    onerror: function() {
      this.reject({
        code: 'HTTP' + this.status,
        message: this.statusText
      });
    },

    send: function(opts) {
      var req = this;

      var promise = new Promise(function(resolve, reject) {
        req.resolve = resolve;
        req.reject = reject;

        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify({
          jsonrpc: '2.0',
          method: opts.body.method,
          params: opts.body.params,
          id: 1
        }));
      });

      this.then = promise.then.bind(promise);
      this.catch = promise.catch.bind(promise);

      return opts.promiseHandler ? opts.promiseHandler.call(this, opts) : this;
    }
  }
};

Request.profiles.jsonrpcResponsePromise = {
  onload: Request.profiles.jsonrpcPromise.onload,
  onerror: onerror,
  send: function(opts) {
    var req = this;

    var promise = new Promise(function(resolve, reject) {
      req.resolve = resolve;
      req.reject = reject;

      if (opts.body) {
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(opts.body));
      } else {
        req.send();
      }
    });

    this.then = promise.then.bind(promise);
    this.catch = promise.catch.bind(promise);

    return opts.promiseHandler ? opts.promiseHandler.call(this, opts) : this;
  }
};

Request.prototype = {
  xhr: function(url, _opts) {
    var req = new XMLHttpRequest();
    var opts = {};
    for (var k in this.defaults)
      opts[k] = this.defaults[k];
    if (_opts) {
      for (k in _opts)
        opts[k] = _opts[k];
    }

    // preserve the original url for debugging
    opts.url = opts._url = url;

    if (opts.prefilter)
      opts.prefilter(opts);

    if (!opts.method)
      opts.method = opts.body ? 'POST' : 'GET';

    if (opts.base && !/^(https?:|\/)/.test(opts.url))
      opts.url = opts.base + opts.url;

    var query = '';
    if (opts.query) {
      for (var k in opts.query) {
        if (opts.query[k] !== undefined)
          query += '&' + encodeURIComponent(k) + (opts.query[k] === '' ? '' : '=' + encodeURIComponent(opts.query[k]));
      }

      if (query) {
        query = query.slice(1);
        opts.url += opts.url.indexOf('?') == -1 ?  '?' + query : '&' + query;
      }
    }

    req.open(opts.method, opts.url);

    ['responseType', 'timeout', 'onreadystatechange', 'withCredentials', 'onabort', 'onerror', 'onload', 'onloadstart', 'onprogress', 'ontimeout', 'onloadend'].forEach(function(v) {
      if (opts[v]) {
        req[v] = opts[v];
      }
    });

    if (opts.send)
      return opts.send.call(req, opts);
    else {
      req.send(opts.body || null);
      return req;
    }
  },

  get: function(url, query, opts) {
    if (!opts)
      opts = {};
    opts.method = 'GET';
    opts.query = query;
    return this.xhr(url, opts);
  },

  delete: function(url, query, opts) {
    if (!opts)
      opts = {};
    opts.method = 'DELETE';
    opts.query = query;
    return this.xhr(url, opts);
  },

  post: function(url, body, opts) {
    if (!opts)
      opts = {};
    opts.method = 'POST';
    opts.body = body;
    return this.xhr(url, opts);
  },

  put: function(url, body, opts) {
    if (!opts)
      opts = {};
    opts.method = 'PUT';
    opts.body = body;
    return this.xhr(url, opts);
  }
};

// CommonJS
if (typeof module != 'undefined' && module.exports)
  module.exports = Request;
