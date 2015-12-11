// Promise
var request = new Request({
  onload: function() {
    var data;
    if (this.status == 200) {
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

    return new Promise(function(resolve, reject) {
      req.resolve = resolve;
      req.reject = reject;

      req.send(data);
    });
  }
});

// JSON
var request = new Request({
  onload: function() {
    var data;
    if (this.status == 200) {
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

    this[data.code ? 'reject' : 'resolve'](data);
  },

  onerror: function() {
    this.reject({
      code: 'HTTP' + this.status,
      message: this.statusText
    });
  },

  send: function(data) {
    var req = this;

    return new Promise(function(resolve, reject) {
      req.resolve = resolve;
      req.reject = reject;

      if (data) {
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(data));
      } else {
        req.send();
      }
    });
  }
});
