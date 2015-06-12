/*!
 * Request v0.2.1
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
  jsonRpcPromise: {
    onreadystatechange: function() {
      if (this.readyState != 4)
        return;

      var data;
      if (this.status >= 200 && this.status < 300 || this.status == 304) {
        try {
          data = JSON.parse(this.responseText);
        } catch (e) {
          this.reject({
            code: 'EJSONPARSE',
            message: 'JSON parse error'
          });
        }
      } else {
        return this.reject(this);
      }

      if (data.error)
        this.reject(data.error);
      else
        this.resolve(data.result);
    },

    onerror: function() {
      this.reject({
        code: 'EXHR',
        message: 'XMLHttpRequest error'
      });
    },

    send: function(opts) {
      var req = this;

      var p = new Promise(function(resolve, reject) {
        req.resolve = resolve;
        req.reject = reject;

        if (opts.body) {
          req.setRequestHeader('Content-Type', 'application/json');
          req.send(JSON.stringify(opts.body));
        } else {
          req.send();
        }
      });

      p.req = req;

      return opts.promiseHandler ? opts.promiseHandler(p) : p;
    }
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

    if (opts.prefilter)
      opts.prefilter(opts);

    if (!opts.method)
      opts.method = opts.body ? 'POST' : 'GET';

    if (opts.base && !/^(https?:|\/)/.test(url))
      url = opts.base + url;

    var query = '';
    if (opts.query) {
      for (var k in opts.query) {
        if (opts.query[k] != undefined)
          query += '&' + encodeURIComponent(k) + (opts.query[k] == '' ? '' : '=' + encodeURIComponent(opts.query[k]));
      }

      if (query) {
        query = query.slice(1);
        url += url.indexOf('?') == -1 ?  '?' + query : '&' + query;
      }
    }

    req.open(opts.method, url);

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
