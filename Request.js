/*!
 * Request v0.2.10
 * http://www.noindoin.com/
 *
 * Copyright 2014 Jiang Fengming <fenix@noindoin.com>
 * Released under the MIT license
 */

function Request(defaults) {
  this.defaults = {};

  for (var k in Request.defaults)
    this.defaults[k] = Request.defaults[k];

  for (k in defaults) {
    this.defaults[k] = defaults[k];
  }
}

Request.defaults = {
  base: '',
  headers: null,
  send: null
};

Request.prototype = {
  send: function(url, _opts) {
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
        if (opts.query[k] != null)
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
    return this.send(url, opts);
  },

  delete: function(url, query, opts) {
    if (!opts)
      opts = {};
    opts.method = 'DELETE';
    opts.query = query;
    return this.send(url, opts);
  },

  post: function(url, data, opts) {
    if (!opts)
      opts = {};
    opts.method = 'POST';
    opts.data = data;
    return this.send(url, opts);
  },

  put: function(url, data, opts) {
    if (!opts)
      opts = {};
    opts.method = 'PUT';
    opts.data = data;
    return this.send(url, opts);
  }
};

// CommonJS
if (typeof module != 'undefined' && module.exports)
  module.exports = Request;
