/*!
 * Request v0.2.9
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
    if (defaults.profile) {
      var profile = defaults.profile;
      if (profile.constructor == String)
        profile = Request.profiles[profile];
      for (p in profile)
        this.defaults[p] = profile[p];
    }
    for (k in defaults) {
      this.defaults[k] = defaults[k];
    }
  }
}

Request.defaults = {
  profile: null,
  base: '',
  headers: null,
  send: null
};

Request.profiles = {
  promise: {
    onload: function() {
      var data;
      if (this.status >= 200 && this.status < 300 || this.status == 304) {
        this.resolve(this.responseText);
      } else {
        this.reject({
          code: 'HTTP' + this.status,
          message: this.statusText
        });
      }
    },

    onerror: function() {
      this.reject({
        code: 'HTTP' + this.status,
        message: this.statusText
      });
    },

    send: function(data) {
      var req = this;

      var promise = new Promise(function(resolve, reject) {
        req.resolve = resolve;
        req.reject = reject;

        req.send(data);
      });

      return this.options.promiseHandler ? this.options.promiseHandler.call(this, promise) : promise;
    }
  },

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

    send: function(data) {
      var req = this;

      var promise = new Promise(function(resolve, reject) {
        req.resolve = resolve;
        req.reject = reject;

        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify({
          jsonrpc: '2.0',
          method: data.method,
          params: data.params,
          id: 1
        }));
      });

      return this.options.promiseHandler ? this.options.promiseHandler.call(this, promise) : promise;
    }
  }
};

Request.profiles.jsonrpcResponsePromise = {
  onload: Request.profiles.jsonrpcPromise.onload,
  onerror: onerror,
  send: function(data) {
    var req = this;

    var promise = new Promise(function(resolve, reject) {
      req.resolve = resolve;
      req.reject = reject;

      if (data) {
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(data));
      } else {
        req.send();
      }
    });

    return this.options.promiseHandler ? this.options.promiseHandler.call(this, promise) : promise;
  }
};

Request.prototype = {
  xhr: function(url, _opts) {
    var opts = {};
    for (var k in this.defaults)
      opts[k] = this.defaults[k];
    if (_opts) {
      for (k in _opts)
        opts[k] = _opts[k];
    }

    opts.url = url;
    if (opts.base && !/^(https?:|\/)/.test(opts.url))
      opts.url = opts.base + opts.url;

    if (!opts.method)
      opts.method = opts.data ? 'POST' : 'GET';

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

    var req = new XMLHttpRequest();
    req.options = opts;
    req.open(opts.method, opts.url);

    ['responseType', 'timeout', 'onreadystatechange', 'withCredentials', 'onabort', 'onerror', 'onload', 'onloadstart', 'onprogress', 'ontimeout', 'onloadend'].forEach(function(v) {
      if (opts[v])
        req[v] = opts[v];
    });

    if (opts.headers) {
      for (var name in opts.headers)
        req.setRequestHeader(name, opts.headers[name]);
    }

    if (opts.send)
      return opts.send.call(req, opts.data);
    else {
      req.send(opts.data);
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

  post: function(url, data, opts) {
    if (!opts)
      opts = {};
    opts.method = 'POST';
    opts.data = data;
    return this.xhr(url, opts);
  },

  put: function(url, data, opts) {
    if (!opts)
      opts = {};
    opts.method = 'PUT';
    opts.data = data;
    return this.xhr(url, opts);
  }
};

// CommonJS
if (typeof module != 'undefined' && module.exports)
  module.exports = Request;
